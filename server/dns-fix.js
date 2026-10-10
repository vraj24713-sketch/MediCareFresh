
const dns = require("dns");

// Use Google DNS for Node.js DNS lookups
dns.setServers(["8.8.8.8", "8.8.4.4"]);

console.log("MediCare DNS configured to use Google DNS.");

require("./server");
