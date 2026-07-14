export class ReconciliationDto {
  ledgerAccountId: string;
  cachedBalance: string;
  computedBalance: string;
  matches: boolean;

  constructor(params: ReconciliationDto) {
    this.ledgerAccountId = params.ledgerAccountId;
    this.cachedBalance = params.cachedBalance;
    this.computedBalance = params.computedBalance;
    this.matches = params.matches;
  }
}
