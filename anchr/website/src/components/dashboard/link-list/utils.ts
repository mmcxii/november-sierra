export function resolveCheckboxState(allSelected: boolean, someSelected: boolean): boolean | "indeterminate" {
  if (allSelected) {
    return true;
  }
  if (someSelected) {
    return "indeterminate";
  }
  return false;
}
