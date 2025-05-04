/* Getter for the form controls belonging to "compare two algorithms" */
export function getKValue() {
  return document.getElementById("formKValue").value;
}

export function getPerformanceMetric() {
  return document.getElementById("formPerformanceMetric").value;
}

export function getFirstAlgorithmId() {
  return Number(document.getElementById("formControlAlgorithm1").value);
}

export function getSecondAlgorithmId() {
  return Number(document.getElementById("formControlAlgorithm2").value);
}

/* Getter for the form controls belonging to "Algorithm performance space" */
export function getKValuePca() {
  return document.getElementById("formKValuePca").value;
}

export function getPerformanceMetricPca() {
  return document.getElementById("formPerformanceMetricPca").value;
}
