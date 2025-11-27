export interface Debt {
    from: string;
    to: string;
    amount: number;
}

export interface Debt {
    from: string;
    to: string;
    amount: number;
}

export class Ledger {
    // DebtorID -> CreditorID -> Amount
    private debts: Map<string, Map<string, number>> = new Map();

    constructor() {
        this.load();
    }

    // Record a transfer from one player to another
    recordTransfer(from: string, to: string, amount: number) {
        if (amount <= 0) return;
        if (from === to) return;

        // Check if there is a reverse debt (to owes from)
        const reverseDebt = this.getDebt(to, from);

        if (reverseDebt > 0) {
            if (reverseDebt >= amount) {
                // Reduce reverse debt
                this.setDebt(to, from, reverseDebt - amount);
                return;
            } else {
                // Clear reverse debt and add remaining as new debt
                this.setDebt(to, from, 0);
                amount -= reverseDebt;
            }
        }

        // Add to existing debt
        const currentDebt = this.getDebt(from, to);
        this.setDebt(from, to, currentDebt + amount);

        this.save();
    }

    private getDebt(from: string, to: string): number {
        return this.debts.get(from)?.get(to) || 0;
    }

    private setDebt(from: string, to: string, amount: number) {
        if (!this.debts.has(from)) {
            this.debts.set(from, new Map());
        }

        if (amount <= 0.001) {
            this.debts.get(from)!.delete(to);
            if (this.debts.get(from)!.size === 0) {
                this.debts.delete(from);
            }
        } else {
            this.debts.get(from)!.set(to, amount);
        }
    }

    getNetBalance(playerId: string): number {
        let balance = 0;

        // Add what others owe this player
        this.debts.forEach((creditors) => {
            balance += creditors.get(playerId) || 0;
        });

        // Subtract what this player owes others
        const myDebts = this.debts.get(playerId);
        if (myDebts) {
            myDebts.forEach((amount) => {
                balance -= amount;
            });
        }

        return balance;
    }

    // Get all active debts for display
    getDebts(): Debt[] {
        const transactions: Debt[] = [];

        this.debts.forEach((creditors, debtorId) => {
            creditors.forEach((amount, creditorId) => {
                if (amount > 0.01) {
                    transactions.push({
                        from: debtorId,
                        to: creditorId,
                        amount: Math.round(amount * 100) / 100
                    });
                }
            });
        });

        return transactions;
    }

    reset() {
        this.debts.clear();
        this.save();
    }

    private save() {
        // Convert Map<string, Map<string, number>> to array for JSON
        const data = Array.from(this.debts.entries()).map(([k, v]) => [k, Array.from(v.entries())]);
        localStorage.setItem('blackjack_ledger_v2', JSON.stringify(data));
    }

    private load() {
        const data = localStorage.getItem('blackjack_ledger_v2');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.debts = new Map(parsed.map(([k, v]: [string, [string, number][]]) => [k, new Map(v)]));
            } catch (e) {
                console.error("Failed to load ledger", e);
                this.debts = new Map();
            }
        }
    }
}
