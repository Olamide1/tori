document.addEventListener("DOMContentLoaded", () => {
    const signupButton = document.getElementById("signup-button");
    const showLoader = () => {
      const loader = document.getElementById("loader");
      loader.classList.remove("hidden");
  };
  
  const hideLoader = () => {
      const loader = document.getElementById("loader");
      loader.classList.add("hidden");
  };
  
  
    signupButton.addEventListener("click", async () => {
      const username = document.getElementById("username").value.trim();
      const fullName = document.getElementById("fullname").value.trim();
      const companyName = document.getElementById("company").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      showLoader()
  
      if (!username || !fullName || !email || !password) {
        hideLoader()
        alert("Please fill in all required fields.");
        return;
      }
  
      try {
        const response = await fetch("http://localhost:3000/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, fullName, companyName, email, password }),
        });
  
        const result = await response.json();
  
        if (response.ok) {
          hideLoader()
          alert("Account created successfully! Login to continue!");
          window.location.href = "login.html";
        } else {
          hideLoader()
          alert(result.message || "Failed to create account");
        }
      } catch (error) {
        hideLoader()
        alert("An error occurred while signing up. Please contact support.");
      }
    });
  });
  