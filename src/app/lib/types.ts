export interface Cohort {
  id: number;
  name: string;
}

export interface Feature {
  code: string;
  name: string;
  type: string;
  sample_size: number;
}

export interface Operator {
  id: number;
  name: string;
  arity: number;
  input_type: string;
  output_type: string;
}

export interface Constant {
  value: number;
  type: string;
}

export interface PhenotypeNode {
  id: number;
  data: Feature | Operator | Constant;
  children: PhenotypeNode[];
}

export interface ListNode {
  feature: Feature;
  negated: boolean;
}

export interface ApproximatePhenotypeValues {
  t: number;
  a: number;
  n: number;
}

export interface PhenotypeFitQuality {
  p: number;
  g: number;
}

export interface PhenotypeSummary {
  phenotype_definition: string;
  cohort_id: number;
  phenotype_values: ApproximatePhenotypeValues[];
  fit_quality_reference: PhenotypeFitQuality[];
  rsquared: number;
}

export function isFeature(p: any): p is Feature {
  return (
    p &&
    typeof p.code === "string" &&
    typeof p.name === "string" &&
    typeof p.type === "string" &&
    typeof p.sample_size === "number"
  );
}

export function isOperator(p: any): p is Operator {
  return (
    p &&
    typeof p.id === "number" &&
    typeof p.name === "string" &&
    typeof p.arity === "number" &&
    typeof p.input_type === "string" &&
    typeof p.output_type === "string"
  );
}

export function isConstant(p: any): p is Constant {
  return p && typeof p.value === "number" && typeof p.type === "string";
}

export function isPhenotypeNode(p: any): p is PhenotypeNode {
  return (
    p &&
    typeof p.id === "number" &&
    typeof p.data !== "undefined" &&
    typeof p.children !== "undefined"
  );
}

export const operators: Operator[] = [
  { id: 0, name: "Root", arity: 1, input_type: "any", output_type: "any" },
  { id: 1, name: "ADD", arity: 2, input_type: "real", output_type: "real" },
  { id: 2, name: "SUB", arity: 2, input_type: "real", output_type: "real" },
  { id: 3, name: "MUL", arity: 2, input_type: "real", output_type: "real" },
  { id: 4, name: "DIV", arity: 2, input_type: "real", output_type: "real" },
  { id: 5, name: "AND", arity: 2, input_type: "bool", output_type: "bool" },
  { id: 6, name: "OR", arity: 2, input_type: "bool", output_type: "bool" },
  { id: 7, name: "NOT", arity: 1, input_type: "bool", output_type: "bool" },
  { id: 8, name: "GT", arity: 2, input_type: "real", output_type: "bool" },
  { id: 9, name: "GE", arity: 2, input_type: "real", output_type: "bool" },
  { id: 10, name: "LT", arity: 2, input_type: "real", output_type: "bool" },
  { id: 11, name: "LE", arity: 2, input_type: "real", output_type: "bool" },
  { id: 12, name: "EQ", arity: 2, input_type: "real", output_type: "bool" },
];

/** Breadth first seach the tree to find the node of interest, then pop it */
export function popFromTree(
  phenotype: PhenotypeNode,
  idToPop: number,
): PhenotypeNode {
  let nodesToVisit: PhenotypeNode[] = [phenotype];
  while (nodesToVisit.length > 0) {
    const node = nodesToVisit[0];
    nodesToVisit = nodesToVisit.slice(1);
    node.children = node.children.filter((child) => child.id !== idToPop);
    nodesToVisit = nodesToVisit.concat(node.children);
  }
  return phenotype;
}

/** Breadth first search the tree and add a child to the given parent */
export function addChild(
  phenotype: PhenotypeNode,
  parentId: number,
  childNode: PhenotypeNode,
): PhenotypeNode {
  let nodesToVisit: PhenotypeNode[] = [phenotype];
  while (nodesToVisit.length > 0) {
    const node = nodesToVisit[0];
    nodesToVisit = nodesToVisit.slice(1);
    if (node.id === parentId) {
      node.children.push(childNode);
      return phenotype;
    } else {
      nodesToVisit = nodesToVisit.concat(node.children);
    }
  }
  alert(`Failed to find node ${parentId}`);
  return phenotype;
}

/** Breadth first search the tree to find all codes in the tree */
export function getCodesTree(phenotype: PhenotypeNode): string[] {
  const codes: string[] = [];
  function visit(node: PhenotypeNode): void {
    if (isFeature(node.data)) {
      codes.push(node.data.code);
    } else if (isOperator(node.data)) {
      node.children.forEach(visit);
    }
  }
  visit(phenotype);
  return codes;
}
