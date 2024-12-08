const resetPassword = async () => {
    const email = document.getElementById("email").value;
  
    try {
      const response = await fetch("http://localhost:3000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
  
      const result = await response.json();
      if (response.ok) {
        alert("Password reset link sent to your email!");
        window.location.href = "login.html";
      } else {
        alert(result.message || "Failed to send reset link");
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };
  