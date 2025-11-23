const fs = require('fs');

if (process.argv.length !== 3) {
    console.error('Usage: node parseSlowQuery.js <slow_query_log_file>');
    process.exit(1);
}

// Path to your slow query log file
const slowQueryFilePath = process.argv[2];

// Path to the output JSON file
const outputJsonFilePath = 'slow-queries.json';

// Read the slow query log file
fs.readFile(slowQueryFilePath, 'utf-8', (err, data) => {
    if (err) {
        console.error('Error reading the file:', err);
        return;
    }

    // Split the log content into lines
    const lines = data.split('\n');

    // Parse each log line into an object
    const slowQueries = [];

    let currentQuery = null;

    for (let line of lines) {
        if (line.trim() === '') continue;

        if (line.startsWith('# Time:')) {
            // Start of a new log entry
            if (currentQuery) {
                slowQueries.push(currentQuery);
            }
            currentQuery = {};
        }

        if (line.startsWith('# User@Host:')) {
            const lineWithoutHeader = line.replace('# User@Host: ', '');
            const [userPart, hostPart] = lineWithoutHeader.split('@');
            currentQuery.user = userPart.split('[')[0].trim();
            currentQuery.host = hostPart.split(' ')[1].trim();
        }

        if (line.startsWith('# Thread_id:')) {
            const lineWithoutHash = line.replace('# ', '');
            const parts = lineWithoutHash.split("  ");

            // Extract the fields
            currentQuery.threadId = parseInt(parts[0].split(':')[1].trim()); // "7"
            currentQuery. schema = parts[1].split(':')[1].trim();   // "symbiota"
            currentQuery.qcHit = parts[2].split(':')[1].trim() !== "No";    // "No"
        }

        if (line.startsWith('# Schema:')) {
            currentQuery.schema = line.split(':')[1].trim();
        }

        if (line.startsWith('# Query_time:')) {
            const queryTime = line.split(':')[1].trim();
            currentQuery.queryTime = parseFloat(queryTime.split(' ')[0]);
        }

        if (line.startsWith('# Rows_sent:')) {
            currentQuery.rowsSent = parseInt(line.split(':')[1].trim());
        }

        if (line.startsWith('# Rows_examined:')) {
            currentQuery.rowsExamined = parseInt(line.split(':')[1].trim());
        }

        if (line.startsWith('# Rows_affected:')) {
            currentQuery.rowsAffected = parseInt(line.split(':')[1].trim());
        }

        if (line.startsWith('# Bytes_sent:')) {
            currentQuery.bytesSent = parseInt(line.split(':')[1].trim());
        }

        if (line.startsWith('# Query:')) {
            currentQuery.query = line.split(':')[1].trim();
        }

        if (line.startsWith('SET timestamp=')) {
            currentQuery.timestamp = Number(line.split('=')[1].replace(/;/, '').trim());
            currentQuery.timedate = Date(currentQuery.timestamp);
        }

        if (line.startsWith('SELECT')) {
        // This is the main query
            currentQuery.query = line.trim();
        }
    }

    // Add the last query if it wasn't added
    if (currentQuery) {
        slowQueries.push(currentQuery);
    }

    // After parsing all queries into the `slowQueries` array
    // Sort descending by queryTime
    slowQueries.sort((a, b) => b.queryTime - a.queryTime);

    // Write the JSON file
    fs.writeFile(outputJsonFilePath, JSON.stringify(slowQueries, null, 2), (err) => {
        if (err) {
            console.error('Error writing JSON file:', err);
            return;
        }
        console.log(`JSON file written to: ${outputJsonFilePath}`);
    });

    // Function to export data to CSV
    function exportToCSV(data, filename) {
        // Extract the headers
        const headers = Object.keys(data[0]);

        // Build the CSV string
        let csv = headers.join(',') + '\n';

        // Add each row
        data.forEach(row => {
            const values = headers.map(header => {
                // Handle special characters and quotes
                const value = String(row[header])
                    .replace(/"/g, '"')
                    .replace(/,/g, ',')
                    .replace(/"/g, '"');

                return `"${value}"`;
            });

            csv += values.join(',') + '\n';
        });

        // Write to file
        fs.writeFile(filename, csv, (err) => {
            if (err) {
                console.error('Error writing CSV file:', err);
                return;
            }
            console.log(`CSV file written to: ${filename}`);
        });
    }

    // Export the CSV
    exportToCSV(slowQueries, 'slow-queries.csv');
});


