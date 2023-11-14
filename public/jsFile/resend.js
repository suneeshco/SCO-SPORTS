document.getElementById("resend").addEventListener("click", function() {
    fetch("/sendOtp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        // body: JSON.stringify(dataToSend)
    })
    .then(response => response.json())
    .then(data => {
        // Handle the response from the server
        console.log("Response from server:", data);
    })
    .catch(error => {
        // Handle any errors that occur during the request
        console.error("Error:", error);
    });
})