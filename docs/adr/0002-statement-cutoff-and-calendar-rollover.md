# Statement Cutoff Boundary and Calendar Rollover Math

We decided that credit card statement cutoff occurs at the start of the closing day (exclusive cutoff: transactions where `purchaseDate >= closingDate` roll over to the subsequent statement period), reflecting real-world cardholder behavior where closing day represents the "best purchase day". If a card's configured `closingDay` or `dueDay` exceeds the days in a calendar month, dates clamp to month-end (`Math.min(day, daysInMonth)`). 

Statement cycles are identified by `cycleId: "YYYY-MM"` indexed by the payment due month rather than closing month to align directly with monthly cash outflow and burn-rate forecasting. All monetary values are strictly typed as integer cents (`amountInCents: number`) to eliminate floating-point drift, and remainder pennies on uneven installments are front-loaded onto the first installment.
