import { parse } from "parse";
export { add };

const tablename = parse(Deno.args).t;

console.log(tablename);

if (!tablename) {
    console.error('Table name is required');
    Deno.exit(1);
}

const API_BASE_URL = 'http://localhost/api';

function add(a: number, b: number): number {
    return a + b;
}

async function fetchApiEndpoints() {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch API endpoints: ${response.statusText}`);
    }
    return response.json();
}

async function fetchTableData(tableName: string) {
    const response = await fetch(`${API_BASE_URL}/${tableName}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch data for table ${tableName}: ${response.statusText}`);
    }
    return response.json();
}

function convertToJSONLD(tableName: string, data: any): any {
    return {
        "@context": "http://schema.org",
        "@type": tableName,
        "data": data
    };
}

async function main() {
    try {
        const endpoints = await fetchApiEndpoints();
        if (!endpoints[tablename]) {
            throw new Error(`Table ${tablename} does not exist in the API endpoints`);
        }

        const data = await fetchTableData(tablename);
        const jsonld = convertToJSONLD(tablename, data);

        console.log(JSON.stringify(jsonld, null, 2));
    } catch (error: any) {
        console.error(error.message);
        Deno.exit(1);
    }
}

main().then(_r => console.log('Done'));
