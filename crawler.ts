import { parse } from "@std/parse";

const { tablename, format } = parse(Deno.args);

if (!tablename) {
    console.error('Table name is required');
    Deno.exit(1);
}

if (!format || (format !== 'json-ld' && format !== 'ttl')) {
    console.error('Format must be either "json-ld" or "ttl"');
    Deno.exit(1);
}

const API_BASE_URL = 'http://localhost/api';

async function fetchApiEndpoints() {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch API endpoints: ${response.statusText}`);
    }
    return response.json();
}

async function fetchTableData(tableName: string) {
    return fetch(`${API_BASE_URL}/${tableName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch data for table ${tableName}: ${response.statusText}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(error.message);
            throw error;
        });
}

async function fetchPaginatedData(endpoint: string) {
    let results = [];
    let nextPage = `${API_BASE_URL}/${endpoint}`;

    while (nextPage) {
        const response = await fetch(nextPage);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const data = await response.json();
        results = results.concat(data.items); // Assuming the data is in an `items` array

        nextPage = data.nextPage; // Assuming the next page URL is in `nextPage`
    }

    return results;
}

function convertToJSONLD(tableName: string, data: any): any {
    return {
        "@context": "http://schema.org",
        "@type": tableName,
        "data": data
    };
}

function convertToTTL(tableName: string, data: any): string {
    // Implement TTL conversion logic here
    return `@prefix schema: <http://schema.org/> .\n\nschema:${tableName} ${JSON.stringify(data, null, 2)} .`;
}

async function crawlTable(tableName: string, visited: Set<string>) {
    if (visited.has(tableName)) return;
    visited.add(tableName);

    const tableData = await fetchTableData(tableName);
    const metadata = tableData.metadata;
    const data = tableData.data;

    let result;
    if (format === 'json-ld') {
        result = convertToJSONLD(tableName, data);
    } else {
        result = convertToTTL(tableName, data);
    }

    await Deno.writeTextFile(`${tableName}.${format}`, JSON.stringify(result, null, 2));

    for (const relatedTable of metadata.relatedTables) {
        await crawlTable(relatedTable, visited);
    }
}

async function main() {
    try {
        const endpoints = await fetchApiEndpoints();
        if (!endpoints[tablename]) {
            throw new Error(`Table ${tablename} does not exist in the API endpoints`);
        }

        const visited = new Set<string>();
        await crawlTable(tablename, visited);

        console.log('Crawling completed.');
    } catch (error: any) {
        console.error(error.message);
        Deno.exit(1);
    }
}

main();
