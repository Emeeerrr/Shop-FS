export function formatCOPFromCents(cents: number) {
  const value = cents; 
  return `$${value.toLocaleString('es-CO')} COP`;
}
