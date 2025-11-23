# MySQL parseSlowQuery
A tool that reads mysql slow_query_log, sort queries by query time descending and outputs to JSON and CSV for easier view.  
Built using NodeJS.

Warning: some queries do not get registered and the output files show `query: undefined`. Use at your own risk.
