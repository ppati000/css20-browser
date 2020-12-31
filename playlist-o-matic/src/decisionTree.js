"use strict";

// Big nope from me for TypeScript when parsing random JSON.
// From http://www.utilities-online.info/xmltojson/#.X-zeWy8rxQI.
import tree from "./model.json";

const topNode = tree.PMML.TreeModel.Node;

const operators = {
  lessOrEqual: (a, b) => a <= b,
  greaterThan: (a, b) => a > b
};

function getDecision(audioData) {
  return getDecisionRecursive(audioData, topNode);
}

function getDecisionRecursive(audioData, currentNode) {
  if (!currentNode.Node) {
    if (!currentNode.ScoreDistribution) {
      throw new Error("node has no child or distribution");
    }

    return Object.assign({}, ...currentNode.ScoreDistribution.map(entry => ({
      [entry["-value"]]: Number(entry["-recordCount"])
    })));
  }

  for (let child of currentNode.Node) {
    const predicate = child.SimplePredicate;
    // Else select next child node.
    const operatorFn = operators[predicate["-operator"]];

    const fieldValue = audioData[predicate["-field"]]
    if (operatorFn(fieldValue, Number(predicate["-value"]))) {
      return getDecisionRecursive(audioData, child);
    }
  }

  throw new Error("no predicate matched");
}

export default getDecision;
