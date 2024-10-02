"use client";

import Image from "next/image";
import { useState } from "react";
import TreePhenotypeBuilder from "../ui/TreeBuilder";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function Tree() {
  function treeBuilderUsage() {
    return (
      <div className="p-5 bg-white border border-t-0 border-gray-200 dark:border-gray-700">
        <p className="mb-2 text-gray-600 dark:text-gray-400">
          To get started, select a cohort from the buttons below. Then define
          the phenotype that interests you by searching for fields in the search
          box below.
        </p>
        <p className="mb-2 text-gray-600 dark:text-gray-400">
          As an example, suppose we are interested hypertensive diabetes
          (diabetes and hypertension). To build this phenotype, we would add
          both diabetes (E11) and hypertension (I10) as children.
        </p>
        <p className="mb-2 text-gray-600 dark:text-gray-400">
          The resulting phenotype would look like this:
        </p>
        <Image
          src={"/tree_example.webp"}
          alt={"Example phenotype"}
          width="0"
          height="0"
          sizes="100vw"
          className="w-1/2 h-auto"
        />
        <p className="my-2 text-gray-600 dark:text-gray-400">
          Once built, you can validate your phenotype and run the GWAS. Our
          server will then start the GWAS calculation and display the status of
          the job. Once complete, a download link to your results will appear.
        </p>
      </div>
    );
  }

  function AccordionUsage() {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div>
        <h2>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full p-5 font-medium rtl:text-right bg-gray-200 text-gray-500 border border-gray-200 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-800 gap-3"
          >
            <span>Usage Instructions</span>
            {isOpen ? (
              <ChevronUp className="font-bold w-5 h-5 shrink-0" />
            ) : (
              <ChevronDown className="font-bold w-5 h-5 shrink-0" />
            )}
          </button>
        </h2>
        {isOpen && treeBuilderUsage()}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <AccordionUsage />
      </div>
      <TreePhenotypeBuilder />
    </div>
  );
}
