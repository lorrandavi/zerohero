# ZeroHero

Personal financial command center for tracking subscriptions and credit card installments.

## Language

**Credit Card**:
A payment card identified by a friendly nickname, a monthly statement closing day, and a payment due day.
_Avoid_: Payment method, account, bank card

**Statement Period**:
The monthly billing cycle of a Credit Card bounded by its statement closing day.
_Avoid_: Invoice cycle, billing window

**Commitment**:
An ongoing financial obligation assigned to a Credit Card, represented as either a Subscription or an Installment.
_Avoid_: Expense, charge, recurring payment, bill

**Subscription**:
A Commitment that renews indefinitely on a fixed frequency (monthly or yearly) until explicitly cancelled.
_Avoid_: Membership, recurring charge

**Installment**:
A Commitment with a fixed total cost divided into a finite number of scheduled payments.
_Avoid_: Parcela, split payment, loan, BNPL

**Payoff Date**:
The specific statement period or date on which the final payment of an Installment occurs.
_Avoid_: Maturity date, expiration date, end date

**Burn Rate**:
The projected total financial outflow for a given calendar month or statement cycle combining active Subscriptions and current Installments.
_Avoid_: Monthly spend, cash burn, total outlay
