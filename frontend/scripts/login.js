document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");

  const showLoader = () => {
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");
};

const hideLoader = () => {
    const loader = document.getElementById("loader");
    loader.classList.add("hidden");
};


  loginButton.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    showLoader()

    if (!email || !password) {
      alert("Please fill in both email and password fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok) {
        // Store token and user information in localStorage
        if (result.token) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));
          hideLoader()
          window.location.href = "dashboard.html"; // Redirect to the dashboard
        } else {
          alert("Login successful, but no token received.");
        }
      } else {
        hideLoader()
        alert(result.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      hideLoader()
      alert("An error occurred while logging in. Contact Support.");
    }
  });
});
