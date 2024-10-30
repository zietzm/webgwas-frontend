import React, { useState, useEffect } from "react";
import {
  Play,
  CheckCircle,
  Loader,
  XCircle,
  MinusCircle,
  Download,
  Lightbulb,
  DatabaseZap,
} from "lucide-react";
import FuzzySelect from "./FuzzySelect";
import { Cohort, Feature, ListNode, PhenotypeSummary } from "../lib/types";
import {
  fetchCohorts,
  convertListToRPN,
  runGWAS,
  getResults,
  fetchFeatures,
  getPhenotypeSummary,
  getPvalues,
  PvaluesResult,
} from "../lib/api";
import ManhattanPlot from "./ManhattanPlot";
import { ImFeelingLuckyList } from "./ImFeelingLucky";
import QualityInformation from "./QualityInformation";
import { API_URL } from "@/app/lib/api";

export function SimplePhenotypeBuilderUsage() {
  return (
    <div className="p-5 bg-white border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg">
      <p className="mb-2 text-gray-600 dark:text-gray-400">
        To get started, select a cohort from the buttons below. Then define the
        phenotype that interests you by searching for fields in the search box
        below.
      </p>
      <p className="mb-2 text-gray-600 dark:text-gray-400">
        As an example, suppose we are interested hypertensive diabetes (diabetes
        and hypertension). To build this phenotype, we would add both diabetes
        (E11) and hypertension (I10) as children.
      </p>
      <p className="mb-2 text-gray-600 dark:text-gray-400">
        The resulting phenotype would look like this:
      </p>
      <div className="flex flex-row">
        <div className="basis-full md:basis-3/5">
          <img
            src="/list_example.webp"
            alt="Usage example for the simple builder"
          />
        </div>
      </div>
      <p className="my-2 text-gray-600 dark:text-gray-400">
        Once built, you can validate your phenotype and run the GWAS. Our server
        will then start the GWAS calculation and display the status of the job.
        Once complete, a download link to your results will appear.
      </p>
    </div>
  );
}

export default function SimplePhenotypeBuilder() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [phenotype, setPhenotype] = useState<ListNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PhenotypeSummary | null>(null);
  const [jobStatus, setJobStatus] = useState<
    "cached" | "queued" | "done" | "error" | null
  >(null);
  const [pvals, setPvals] = useState<PvaluesResult | null>(null);
  const [isSingleField, setIsSingleField] = useState<boolean>(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);

  // Fetch cohorts
  useEffect(() => {
    async function doFetch() {
      setIsLoading(true);
      try {
        const cohorts = await fetchCohorts();
        setCohorts(cohorts);
        setSelectedCohort(cohorts[0]);
      } catch (error) {
        let errorMessage = "Error fetching cohorts";
        if (error instanceof Error) {
          errorMessage = `Error fetching cohorts: ${error.message}`;
        }
        setError(errorMessage);
      }
      setIsLoading(false);
    }
    doFetch();
  }, []);

  // Fetch features
  useEffect(() => {
    async function handleFetchFeatures() {
      if (selectedCohort) {
        const cohortFeatures = await fetchFeatures(selectedCohort);
        const binaryFeatures = cohortFeatures.filter((f) => f.type === "BOOL");
        setFeatures(binaryFeatures);
      }
    }
    handleFetchFeatures();
  }, [selectedCohort]);

  async function handleRunGWAS() {
    if (!selectedCohort) {
      alert("Please select a cohort first.");
      return;
    }
    if (!phenotype.length) {
      alert("Please add at least one node to your phenotype.");
    }
    if (phenotype.length === 1) {
      setIsSingleField(true);
    }
    try {
      setJobStatus("queued");
      const phenotypeDefinition = convertListToRPN(phenotype);
      if (!isSingleField) {
        const phenotypeSummary = await getPhenotypeSummary(
          phenotypeDefinition,
          selectedCohort,
        );
        setSummary(phenotypeSummary);
      }
      const result = await runGWAS(phenotypeDefinition, selectedCohort);
      setJobStatus(result.status);
      if (result.status === "cached") {
        setIsCached(true);
      }
      setRequestId(result.request_id);
      await pollJobStatus(result.request_id);
    } catch (err) {
      let errorMessage = "Error running GWAS";
      if (err instanceof Error) {
        errorMessage = `Error running GWAS: ${err.message}`;
      }
      alert(errorMessage);
      setJobStatus("error");
    }
  }

  async function pollJobStatus(requestId: string) {
    try {
      const result = await getResults(requestId);
      switch (result.status) {
        case "cached":
          setIsCached(true);
        case "done":
          setJobStatus(result.status);
          await downloadPvals(requestId);
          return;
        case "error":
          setJobStatus("error");
          break;
        default:
          setTimeout(() => pollJobStatus(requestId), 1000); // Poll every second
      }
    } catch (err) {
      setJobStatus("error");
    }
  }

  async function downloadPvals(requestId: string) {
    try {
      const featureCodes = phenotype.map((p) => p.feature.code);
      const result = await getPvalues(
        requestId,
        selectedCohort!.id,
        featureCodes,
      );
      setPvals(result);
    } catch (err) {
      alert("Failed to download pvalues. Please try again.");
      setJobStatus("error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin" size={40} />
      </div>
    );
  }
  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  function CohortSelector() {
    return (
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">Select Cohort</h2>
        <div className="flex flex-wrap gap-2">
          {cohorts.map((cohort) => (
            <button
              key={cohort.id}
              onClick={() => {
                if (
                  jobStatus === null ||
                  jobStatus === "done" ||
                  jobStatus === "cached"
                ) {
                  setSelectedCohort(cohort);
                  setPhenotype([]);
                  setJobStatus(null);
                  setSummary(null);
                  setPvals(null);
                  setIsSingleField(false);
                  setError("");
                  setIsLoading(false);
                } else {
                  alert("Please wait for the current job to finish.");
                }
              }}
              className={`py-2 px-4 rounded-full transition-colors ${
                selectedCohort === cohort
                  ? "bg-blue-main text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {cohort.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function PhenotypeBuilderDisplay() {
    return (
      <div className="mb-6">
        {phenotype.map((node, index) => (
          <div key={index} className="my-0.5 ml-4 flex-1 flex-row align-middle">
            {index > 0 && <b className="align-middle text-blue-dark">AND </b>}
            {node.negated && jobStatus === null && (
              <button
                onClick={() => {
                  setPhenotype((prevPhenotype) => {
                    const newPhenotype = [...prevPhenotype];
                    newPhenotype[index].negated = false;
                    return newPhenotype;
                  });
                }}
              >
                <b className="mr-1 p-1 align-middle text-red-600 bg-red-100 hover:bg-red-200 active:bg-red-300 rounded">
                  NOT
                </b>
              </button>
            )}
            {node.negated && jobStatus !== null && (
              <b className="mr-1 p-1 align-middle text-red-600 bg-red-100 rounded">
                NOT
              </b>
            )}
            {node.feature.name} [{node.feature.code}] (N=
            {node.feature.sample_size})
            {jobStatus === null && phenotype.length > 1 && !node.negated && (
              <button
                onClick={() => {
                  setPhenotype((prevPhenotype) => {
                    const newPhenotype = [...prevPhenotype];
                    newPhenotype[index].negated = true;
                    return newPhenotype;
                  });
                }}
              >
                <a className="ml-5 p-1 align-middle text-red-600 bg-red-100 hover:bg-red-200 active:bg-red-300 rounded">
                  Click to negate
                </a>
              </button>
            )}
            {jobStatus === null && (
              <button
                onClick={() => {
                  setPhenotype((prevPhenotype) => {
                    const newPhenotype = [...prevPhenotype];
                    newPhenotype.splice(index, 1);
                    return newPhenotype;
                  });
                }}
                className="ml-2 p-1 align-middle rounded hover:bg-gray-200 active:bg-gray-300"
              >
                <MinusCircle size={20} />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  }

  function JobStatusBoxes() {
    return (
      <div className="flex items-center bg-gray-100 p-2 rounded-lg">
        {jobStatus === "queued" && (
          <Loader className="animate-spin mr-2" size={20} />
        )}
        {isCached && <DatabaseZap className="mr-2 text-green-main" size={20} />}
        {!isCached && jobStatus === "done" && (
          <CheckCircle className="mr-2 text-green-main" size={20} />
        )}
        {jobStatus === "error" && (
          <XCircle className="mr-2 text-red-600" size={20} />
        )}
        <span className="text-gray-700">
          {isCached && "GWAS cached."}
          {!isSingleField && jobStatus === "queued" && "GWAS queued..."}
          {!isSingleField &&
            !isCached &&
            jobStatus === "done" &&
            "GWAS completed."}
          {!isSingleField &&
            jobStatus === "error" &&
            "GWAS failed. Please try again."}{" "}
          {isSingleField && jobStatus === "queued" && "Upload queued..."}
          {isSingleField && jobStatus === "done" && "Ready for download."}
          {isSingleField && jobStatus === "error" && "Upload failed"}
        </span>
      </div>
    );
  }

  function GWASButtons() {
    return (
      <div className="flex flex-wrap gap-4 mt-4">
        {jobStatus === null && (
          <button
            onClick={() => {
              handleRunGWAS();
            }}
            className="bg-green-main hover:bg-green-dark text-white font-semibold py-2 px-4 rounded-lg flex items-center transition-colors"
          >
            <Play className="mr-2" size={20} />
            Run GWAS
          </button>
        )}
        {jobStatus && <JobStatusBoxes />}
        {jobStatus && (jobStatus === "done" || jobStatus === "cached") && (
          <div>
            <a href={`${API_URL}/download/${requestId}`} download>
              <button className="bg-blue-main hover:bg-blue-dark text-white font-semibold py-2 px-4 rounded-lg flex items-center transition-colors">
                <Download className="mr-2" size={20} />
                Download Results
              </button>
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border shadow-sm rounded-lg p-4 md:p-6 items-center mb-6">
      <CohortSelector />
      <h2 className="text-xl font-semibold mb-4">Build GWAS phenotype</h2>
      {phenotype.length > 0 && <PhenotypeBuilderDisplay />}
      {selectedCohort && jobStatus === null && (
        <div className="my-2 flex justify-between flex-wrap gap-2 md:flex-nowrap">
          <div className="grow mr-2 flex-1 min-w-[250px]">
            <FuzzySelect
              fuseThreshold={0.3} // Higher number is more lenient
              options={features}
              closeMenuOnSelect={false}
              onChange={(selectedOption) => {
                const node: ListNode = {
                  feature: selectedOption as Feature,
                  negated: false,
                };
                setPhenotype([...phenotype, node]);
              }}
              value={null}
              getOptionLabel={(option) =>
                `${option.name} [${option.code}] (N=${option.sample_size})`
              }
              getOptionValue={(option) => option.code}
              placeholder="Search for a field..."
            />
          </div>
          <ImFeelingLuckyList features={features} setPhenotype={setPhenotype} />
        </div>
      )}
      {isSingleField && jobStatus && (
        <div className="bg-gray-100 p-2 rounded-lg my-2 flex">
          <Lightbulb className="mr-2" size={20} color="#CA8A04" />
          GWAS already run, please wait for the results to be made available.
        </div>
      )}
      {phenotype.length > 0 && <GWASButtons />}
      {summary && <QualityInformation data={summary} />}
      {pvals && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">
            Summary of results: Manhattan plot
          </h2>
          <ManhattanPlot data={pvals} />
        </div>
      )}
    </div>
  );
}
