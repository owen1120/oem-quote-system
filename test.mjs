
async function test() {
  try {
    console.log("Testing Edge Function...");
    const res = await fetch("http://127.0.0.1:54321/functions/v1/generate-quote", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
      },
      body: JSON.stringify({ raw_requirement: "500個白鐵L型支架，下週三交" })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error connecting to Edge Function:", err);
  }
}

test();
