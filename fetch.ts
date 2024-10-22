// Output: JSON Data
const jsonResponse: Response = await fetch("https://api.github.com/users/denoland");
const jsonData: JSON = await jsonResponse.json();

console.log(jsonData, "\n");

// Output: HTML Data
const textResponse: Response = await fetch("https://deno.land/");
const textData: string = await textResponse.text();

console.log(textData, "\n");

// Output: Error Message
await fetch("https://does.not.exist/")
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        return response.json();
    })
    .catch(error => console.error(error.message))
    .finally(() => console.log("Done"));

