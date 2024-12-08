document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("You are not logged in!");
    window.location.href = "login.html";
    return;
  }

  const token = `Bearer ${localStorage.getItem("token")}`;
  const welcomeMessage = document.getElementById("welcome-message");
  const logoutButton = document.getElementById("logout-button");
  const schemaUploadNav = document.getElementById("schema-upload-nav");
  const aiQueryNav = document.getElementById("ai-query-nav");
  const queryHistoryNav = document.getElementById("query-history-nav");
  const favoritesNav = document.getElementById("favorites-nav");
  const settingsNav = document.getElementById("settings-nav");
  const schemaUploadSection = document.getElementById("schema-upload-section");
  const querySchemasSection = document.getElementById("query-schemas-section");
  const queryHistorySection = document.getElementById("query-history-section");
  const favoritesSection = document.getElementById("favorites-section");
  const settingsSection = document.getElementById("settings-section");
  const errorMessage = document.getElementById("error-message");
  const schemaSelector = document.getElementById("schema-selector");
  const queryInput = document.getElementById("query-input");
  const aiGeneratedSql = document.getElementById("ai-generated-sql");
  const generatedSqlText = document.getElementById("generated-sql-text");
  const generateQueryButton = document.getElementById("generate-query");
  const copyToClipboardButton = document.getElementById("copy-to-clipboard");
  const saveFavoriteButton = document.getElementById("save-favorite");
  const updateProfileForm = document.getElementById("update-profile-form");
  const changePasswordForm = document.getElementById("change-password-form");
  const deleteAccountButton = document.getElementById("delete-account-button");
  const queryHistoryTable = document.getElementById("query-history-table");
  const queryHistorySearch = document.getElementById("query-history-search");
  const favoritesTable = document.getElementById("favorites-table");
  const uploadTab = document.getElementById("upload-tab");
  const manualTab = document.getElementById("manual-tab");
  const uploadSchema = document.getElementById("upload-schema");
  const manualSchema = document.getElementById("manual-schema");
  const addColumnButton = document.getElementById("add-column");
  const columnsContainer = document.getElementById("columns-container");
  const goToUpload = document.getElementById("go-to-upload");
  const validateQueryButton = document.getElementById("validate-query");
  const dbConfigModal = document.getElementById("db-config-modal");
  const dbConfigForm = document.getElementById("db-config-form");
  const closeDbConfig = document.getElementById("close-db-config");
  const uploadButton = document.getElementById("upload-button");
  const saveSchemaButton = document.getElementById("save-schema");
  const schemaFileInput = document.getElementById("schema-file");
  const schemaNameInput = document.getElementById("schema-name"); // Define this if used in the function
  
  


  let currentPage = 1;
  const itemsPerPage = 20;
  let dbConfig = {};


  const resetSections = () => {
    [schemaUploadSection, querySchemasSection, queryHistorySection, favoritesSection, settingsSection].forEach((section) =>
      section.classList.add("hidden")
    );
    errorMessage.classList.add("hidden");
    aiGeneratedSql.classList.add("hidden");
  };

  const updateQueryButtonState = async () => {
    try {
      const trialResponse = await fetch("http://localhost:3000/api/subscribers/details", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      if (!trialResponse.ok) {
        console.error("Failed to check trial status.");
        return;
      }
  
      const { remainingQueries } = await trialResponse.json();
      const generateQueryButton = document.getElementById("generate-query");
      const queryLimitMessage = document.getElementById("query-limit-message");
  
      if (remainingQueries <= 0) {
        generateQueryButton.disabled = true;
        queryLimitMessage.classList.remove("hidden");
      } else {
        generateQueryButton.disabled = false;
        queryLimitMessage.classList.add("hidden");
      }
    } catch (error) {
      console.error("Error fetching subscription details:", error);
    }
  };
  
  

  const switchActiveTab = (nav) => {
    document.querySelectorAll("aside a").forEach((el) =>
      el.classList.remove("bg-indigo-600", "text-white")
    );
    nav.classList.add("bg-indigo-600", "text-white");
  };
// Event Listeners for Validation Modal
validateQueryButton.addEventListener("click", () => {
  dbConfigModal.classList.remove("hidden");
});
dbConfigForm.addEventListener("submit", (e) => {
  e.preventDefault();
  dbConfig = {
    host: document.getElementById("db-host").value,
    port: document.getElementById("db-port").value,
    user: document.getElementById("db-user").value,
    password: document.getElementById("db-password").value,
    database: document.getElementById("db-name").value,
  };
  dbConfigModal.classList.add("hidden");
  alert("Database configuration saved.");
});

closeDbConfig.addEventListener("click", () => {
  dbConfigModal.classList.add("hidden");
});

  if (welcomeMessage) {
    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    welcomeMessage.textContent = `${timeOfDay}, ${user.username}!`;
  }

  logoutButton.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
  });

  

  schemaUploadNav.addEventListener("click", () => {
    resetSections();
    schemaUploadSection.classList.remove("hidden");
    switchActiveTab(schemaUploadNav);
  });

  aiQueryNav.addEventListener("click", async () => {
    const schemas = await fetchSchemas();
    resetSections();
    if (schemas.length === 0) {
      errorMessage.classList.remove("hidden");
    } else {
      setupAutosuggest(); // Set up autosuggest for the selected schema
      populateSchemaSelector(schemas);
    }
    querySchemasSection.classList.remove("hidden");
    switchActiveTab(aiQueryNav);
  });

  const showLoader = () => {
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");
};

const hideLoader = () => {
    const loader = document.getElementById("loader");
    loader.classList.add("hidden");
};



document.addEventListener("DOMContentLoaded", () => {
  updateQueryButtonState(); // Call on page load
});


const setupAutosuggest = async () => {
  try {
    const schemaId = schemaSelector.value;
    if (!schemaId) return;

    const response = await fetch(`http://localhost:3000/api/schemas/${schemaId}/metadata`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (response.ok) {
      const { metadata } = await response.json();

      // Combine table and column names for autosuggest
      const suggestions = metadata.map((item) => `${item.tableName}.${item.columnName}`);

      // Initialize autosuggest library (example with Awesomplete)
      new Awesomplete(queryInput, {
        list: suggestions,
        minChars: 1,
      });

      // Ensure #query-input size remains consistent
      queryInput.style.minHeight = "150px";
      queryInput.style.width = "100%"; // Prevent width reduction
      queryInput.style.resize = "vertical"; // Allow vertical resizing only
    } else {
      console.error("Failed to fetch schema metadata.");
    }
  } catch (error) {
    console.error("Error setting up autosuggest:", error);
  }
};



generateQueryButton.addEventListener("click", async () => {
  const schemaId = schemaSelector.value;
  const prompt = queryInput.value.trim();
  const databaseType = "mysql";

  showLoader();

  if (!schemaId || !prompt) {
    hideLoader();
    alert("Please select a schema and provide a query prompt.");
    return;
  }

  try {
    // Check remaining queries via subscription details
    const trialResponse = await fetch("http://localhost:3000/api/subscribers/details", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    if (!trialResponse.ok) {
      throw new Error("Error validating trial status.");
    }

    const { remainingQueries } = await trialResponse.json();

    if (remainingQueries <= 0) {
      hideLoader();
      alert("Your trial has ended. Please upgrade to Pro to continue.");
      return;
    }

    // Proceed with generating the query
    const response = await fetch(`http://localhost:3000/api/schemas/${schemaId}/generate-query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ prompt, databaseType }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Generate Query API Error:", error);
      hideLoader();
      alert(error.message || "Failed to generate query.");
      return;
    }

    const result = await response.json();
    hideLoader();
    generatedSqlText.textContent = result.sql; // Display generated SQL
    aiGeneratedSql.classList.remove("hidden"); // Show the results section

    // Update button state after generating a query
    await updateQueryButtonState();
  } catch (error) {
    hideLoader();
    console.error("Error generating query:", error);
    alert("Unable to validate trial status or generate query. Please try again later.");
  }
});


  // Copy SQL to Clipboard
  copyToClipboardButton.addEventListener("click", () => {
    const sql = generatedSqlText.textContent.trim();
    if (sql) {
      navigator.clipboard.writeText(sql);
      alert("SQL copied to clipboard.");
    } else {
      alert("No SQL to copy.");
    }
  });
  
  saveFavoriteButton.addEventListener("click", async () => {
    const schemaId = schemaSelector.value;
    const queryName = prompt("Enter a name for this query:");
    const queryText = generatedSqlText.textContent.trim();
    showLoader()
  
    if (!queryName || !queryText) {
      hideLoader()
      alert("Query name and text are required.");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:3000/api/schemas/${schemaId}/save-query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ queryName, queryText }),
      });
  
      const result = await response.json();
      if (response.ok) {
        hideLoader()
        alert("Query saved as favorite successfully.");
      } else {
        hideLoader()
        alert(result.message || "Failed to save query as favorite.");
      }
    } catch (error) {
      hideLoader()
      console.error("Error saving favorite query:", error);
      alert("Error saving query. Please try again later.");
    }
  });
  

  queryHistoryNav.addEventListener("click", async () => {
    const schemaId = schemaSelector.value;
    if (!schemaId) {
      alert("Please select a schema in the generate query section to view its query history.");
      return;
    }
    resetSections();
    await fetchQueryHistory(schemaId);
    queryHistorySection.classList.remove("hidden");
    switchActiveTab(queryHistoryNav);
  });

  favoritesNav.addEventListener("click", async () => {
    const schemaId = schemaSelector.value;
    if (!schemaId) {
      alert("Please select a schema in the generate query section to view favorites.");
      return;
    }
    resetSections();
    await fetchFavorites(schemaId);
    favoritesSection.classList.remove("hidden");
    switchActiveTab(favoritesNav);
  });
  const fetchSubscriptionDetails = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/subscribers/details", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      if (!response.ok) throw new Error("Failed to fetch subscription details.");
  
      const { plan, remainingQueries } = await response.json();
  
      const subscriptionInfo = document.getElementById("subscription-info");
      const upgradeOptions = document.getElementById("upgrade-options");
  
      if (plan === "Pro") {
        subscriptionInfo.textContent = "You are on the Pro plan. Unlimited queries available.";
        upgradeOptions.classList.add("hidden");
      } else if (plan === "Trial") {
        subscriptionInfo.textContent = `You are on a trial plan. ${remainingQueries} query(ies) remaining.`;
        upgradeOptions.classList.remove("hidden");
      } else {
        subscriptionInfo.textContent = "You do not have an active subscription.";
        upgradeOptions.classList.remove("hidden");
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching subscription details. Please try again.");
    }
  };
  
  settingsNav.addEventListener("click", async () => {
    resetSections();
    settingsSection.classList.remove("hidden");
    switchActiveTab(settingsNav);
  
    fetchSubscriptionDetails(); // Fetch subscription details
  
    try {
      showLoader();
      const response = await fetch("http://localhost:3000/api/auth/profile", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      if (response.ok) {
        const user = await response.json();
        document.getElementById("username").value = user.username;
        document.getElementById("company-name").value = user.companyName || "";
        hideLoader();
      } else {
        const error = await response.json();
        console.error("Error loading profile:", error.message);
        hideLoader();
        alert(error.message || "Failed to load profile.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      hideLoader();
      alert("Error fetching profile. Please try again later.");
    }
  });
  

  //TODO here: add stripe call, on success you can then call our upgrade end
  document.getElementById("upgrade-button").addEventListener("click", async () => {
    try {
      const response = await fetch("http://localhost:3000/api/subscribers/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
  
      if (response.ok) {
        alert("Successfully upgraded to Pro!");
        await updateQueryButtonState(); // Update button state after upgrade
      } else {
        alert("Failed to upgrade. Please try again.");
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Error upgrading to Pro. Please contact support.");
    }
  });
  
  
  document.getElementById("enterprise-contact-button").addEventListener("click", () => {
    alert("Please contact sales@tori.com for enterprise solutions.");
  });
  

  uploadTab.addEventListener("click", () => {
    uploadSchema.classList.remove("hidden");
    manualSchema.classList.add("hidden");
    uploadTab.classList.add("text-primary", "border-primary");
    manualTab.classList.remove("text-primary", "border-primary");
    manualTab.classList.add("text-gray-500");
  });

  manualTab.addEventListener("click", () => {
    manualSchema.classList.remove("hidden");
    uploadSchema.classList.add("hidden");
    manualTab.classList.add("text-primary", "border-primary");
    uploadTab.classList.remove("text-primary", "border-primary");
    uploadTab.classList.add("text-gray-500");
    renderColumns();
  });

  goToUpload.addEventListener("click", () => {
    schemaUploadSection.classList.remove("hidden");
    querySchemasSection.classList.add("hidden");
    errorMessage.classList.add("hidden");
    switchActiveTab(schemaUploadNav);
  });

  const fetchSchemas = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/schemas", {
        headers: { Authorization: token },
      });
      return response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error fetching schemas:", error);
      return [];
    }
  };

  const fetchQueryHistory = async (schemaId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/schemas/${schemaId}/history`, {
        headers: { Authorization: token },
      });
      if (response.ok) {
        const data = await response.json();
        populateQueryHistoryTable(data.history);
      } else {
        alert("Failed to load query history.");
      }
    } catch (error) {
      console.error("Error fetching query history:", error);
    }
  };

  const fetchFavorites = async (schemaId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/schemas/${schemaId}/favorites`, {
        headers: { Authorization: token },
      });
      if (response.ok) {
        const data = await response.json();
        populateFavoritesTable(data.favorites);
      } else {
        alert("Failed to load favorites.");
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const populateSchemaSelector = (schemas) => {
    schemaSelector.innerHTML =
      '<option value="" disabled selected>Select a Schema</option>';
    schemas.forEach((schema) => {
      const option = document.createElement("option");
      option.value = schema._id;
      option.textContent = schema.name;
      schemaSelector.appendChild(option);
    });
  };

  // Add schema selection event listener here
  schemaSelector.addEventListener("change", async () => {
    const schemaId = schemaSelector.value;
  
    if (!schemaId) {
      console.error("No schema selected.");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:3000/api/schemas/${schemaId}/metadata`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      if (response.ok) {
        const { metadata } = await response.json();
        const suggestions = metadata.map((item) => `${item.tableName}.${item.columnName}`);
  
        // Initialize autosuggest
        new Awesomplete(queryInput, {
          list: suggestions,
          minChars: 1,
        });
  
        console.log("Autosuggestions loaded.");
      } else {
        console.error("Failed to fetch schema metadata.");
      }
    } catch (error) {
      console.error("Error fetching schema metadata:", error);
    } finally {
      // Ensure #query-input styling is consistent
      queryInput.style.height = "auto"; // Reset to fit content
      queryInput.style.minHeight = "150px";
      queryInput.style.width = "100%";
      queryInput.style.resize = "vertical";
    }
  });
  
  
  
  

  const populateQueryHistoryTable = (history) => {
    queryHistoryTable.innerHTML = "";
    if (history.length === 0) {
      queryHistoryTable.innerHTML =
        '<tr><td colspan="4" class="text-center py-2">No query history available.</td></tr>';
      return;
    }
  
    history.forEach((entry) => {
      const row = document.createElement("tr");
      row.className = "border-b hover:bg-gray-50"; // Add hover effect and row borders
      row.innerHTML = `
        <td class="py-3 px-4 text-sm text-gray-700">${new Date(entry.createdAt).toLocaleString()}</td>
        <td class="py-3 px-4 text-sm text-gray-700">${entry.prompt}</td>
        <td class="py-3 px-4 text-sm text-gray-700">${entry.generatedQuery}</td>
        <td class="py-3 px-4 text-sm text-gray-700 flex space-x-2">
          <button class="btn-secondary re-run-btn">Re-Run</button>
          <button class="btn-accent export-btn">Export</button>
        </td>
      `;
      queryHistoryTable.appendChild(row);
  
      // Attach event listeners
      const reRunButton = row.querySelector(".re-run-btn");
      const exportButton = row.querySelector(".export-btn");
  
      reRunButton.addEventListener("click", () => reRunQuery(entry.prompt));
      exportButton.addEventListener("click", () => exportQuery(entry.generatedQuery));
    });
  };
  
  

  const populateFavoritesTable = (favorites) => {
    favoritesTable.innerHTML = "";
    if (favorites.length === 0) {
      favoritesTable.innerHTML =
        '<tr><td colspan="3" class="text-center py-2">No favorite queries available.</td></tr>';
      return;
    }
  
    favorites.forEach((favorite) => {
      const row = document.createElement("tr");
      row.className = "border-b hover:bg-gray-50"; // Add hover effect and row borders
      row.innerHTML = `
        <td class="py-3 px-4 text-sm text-gray-700">${favorite.name}</td>
        <td class="py-3 px-4 text-sm text-gray-700">${favorite.query}</td>
        <td class="py-3 px-4 text-sm text-gray-700 flex space-x-2">
          <button class="btn-accent use-btn">Use</button>
          <button class="btn-secondary remove-btn">Remove</button>
        </td>
      `;
      favoritesTable.appendChild(row);
  
      // Attach event listeners
      const useButton = row.querySelector(".use-btn");
      const removeButton = row.querySelector(".remove-btn");
  
      useButton.addEventListener("click", () => useFavoriteQuery(favorite.query));
      removeButton.addEventListener("click", () => removeFavorite(favorite._id));
    });
  };
  
  

  const renderColumns = () => {
    const columns = Array.from(columnsContainer.children);
    const totalItems = columns.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
  
    // Show or hide each column based on the current page
    columns.forEach((column, index) => {
      column.style.display = index >= startIndex && index < endIndex ? "flex" : "none";
    });
  
    // Determine if pagination is needed
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const prevPageBtn = document.getElementById("prev-page");
    const nextPageBtn = document.getElementById("next-page");
  
    // Update button visibility and state
    prevPageBtn.style.display = totalPages > 1 ? "inline-block" : "none";
    nextPageBtn.style.display = totalPages > 1 ? "inline-block" : "none";
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  };
  
  const uploadSchemaFile = async () => {
    const file = schemaFileInput.files[0]; // Ensure schemaFileInput is defined
    const schemaName = schemaNameInput.value; // Ensure schemaNameInput is defined
  
    if (!file || !schemaName) {
      alert("Please provide a schema name and file.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", schemaName);
  
    try {
      const response = await fetch("http://localhost:3000/api/schemas/upload", {
        method: "POST",
        headers: { Authorization: token },
        body: formData,
      });
  
      const result = await response.json();
      if (response.ok) {
        alert("Schema uploaded successfully.");
        schemaNameInput.value = ""; // Clear the input
        schemaFileInput.value = ""; // Clear the file input
      } else {
        alert(result.message || "Failed to upload schema.");
      }
    } catch (error) {
      console.error("Error uploading schema:", error);
      alert("Error uploading schema. Please try again later.");
    }
  };
  
  const saveManualSchema = async () => {
    const schemaName = schemaNameInput.value.trim();
    const columns = Array.from(columnsContainer.children).map((row) => {
      const columnName = row.querySelector(".column-name");
      const dataType = row.querySelector(".data-type");
      const description = row.querySelector(".description");
  
      if (!columnName || !dataType) {
        console.error("Missing required column inputs.");
        return null; // Skip invalid rows
      }
  
      return {
        name: columnName.value.trim(),
        dataType: dataType.value.trim(),
        description: description ? description.value.trim() : "",
      };
    }).filter((column) => column !== null);
  
    if (!schemaName) {
      alert("Please provide a schema name.");
      return;
    }
  
    if (columns.length === 0) {
      alert("Please define at least one column.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:3000/api/schemas", {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: schemaName, columns }),
      });
  
      if (response.ok) {
        alert("Schema saved successfully.");
        columnsContainer.innerHTML = ""; // Clear form
        schemaNameInput.value = ""; // Clear name input
      } else {
        const error = await response.json();
        alert(error.message || "Failed to save schema.");
      }
    } catch (error) {
      console.error("Error saving schema:", error);
      alert("Error saving schema. Please try again later.");
    }
  };
  
  

  uploadButton.addEventListener("click", uploadSchemaFile);
  saveSchemaButton.addEventListener("click", saveManualSchema);

  uploadTab.addEventListener("click", () => {
    uploadSchema.classList.remove("hidden");
    manualSchema.classList.add("hidden");
    uploadTab.classList.add("text-primary", "border-primary");
    manualTab.classList.remove("text-primary", "border-primary");
  });


  const reRunQuery = (prompt) => {
    if (!prompt) {
      alert("No prompt available to re-run.");
      return;
    }
    queryInput.value = prompt; // Populate the input field
    aiQueryNav.click(); // Trigger the AI Query Generator section
  };
  
// Utility Functions
const validateGeneratedQuery = async () => {
  const schemaId = schemaSelector.value;
  const query = generatedSqlText.textContent;

  if (!query) {
    alert("No query to validate. Generate one first.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/schemas/${schemaId}/validate-query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ query, dbConfig }),
    });

    const result = await response.json();
    if (response.ok) {
      alert("Query executed successfully. Check console for results.");
      console.log("Query Results:", result.result);
    } else {
      alert(result.message || "Query validation failed.");
    }
  } catch (error) {
    console.error("Error validating query:", error);
    alert("Error validating query. Please try again later.");
  }
};
document.getElementById("validate-query").addEventListener("click", validateGeneratedQuery);

const exportQuery = (queryText) => {
  if (!queryText) {
    alert("Cannot export an empty query.");
    return;
  }
  const blob = new Blob([queryText], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "query.sql";
  link.click();
};


  addColumnButton.addEventListener("click", () => {
    const columnRow = document.createElement("div");
    columnRow.classList.add("flex", "items-center", "space-x-4", "mt-2");
    columnRow.innerHTML = `
      <input type="text" class="form-input" placeholder="Column Name" required />
      <input type="text" class="form-input" placeholder="Data Type" required />
      <input type="text" class="form-input" placeholder="Description (Optional)" />
      <button type="button" class="btn-primary remove-column">Remove</button>
    `;

    const removeButton = columnRow.querySelector(".remove-column");
    removeButton.addEventListener("click", () => {
      columnRow.remove();
      renderColumns();
    });

    columnsContainer.appendChild(columnRow);
    renderColumns();
  });

  // Profile Settings Handlers
  updateProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showLoader()
  
    const username = document.getElementById("username").value.trim();
    const companyName = document.getElementById("company-name").value.trim();
  
    try {
      const response = await fetch("http://localhost:3000/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ username, companyName }),
      });
  
      const result = await response.json();
      hideLoader()
      if (response.ok) {
        hideLoader()
        alert("Profile updated successfully.");
        localStorage.setItem("user", JSON.stringify(result.user));
      } else {
        hideLoader()
        alert(
          result.message === "This username is already taken"
            ? "The username is already in use. Please choose a different one."
            : result.message || "Failed to update profile."
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again later.");
    }
  });

  changePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    showLoader()
    try {
      const response = await fetch("http://localhost:3000/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const result = await response.json();
      hideLoader()
      if (response.ok) {
        hideLoader()
        alert("Password changed successfully.");
      } else {
        hideLoader()
        alert(result.message || "Failed to change password.");
      }
    } catch (error) {
      hideLoader()
      console.error("Error changing password:", error);
      alert("Error changing password.");
    }
  });

  deleteAccountButton.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;

    try {
      showLoader()
      const response = await fetch("http://localhost:3000/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      if (response.ok) {
        hideLoader()
        alert("Account deleted successfully.");
        localStorage.clear();
        window.location.href = "signup.html";
      } else {
        hideLoader()
        const result = await response.json();
        alert(result.message || "Failed to delete account.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Error deleting account.");
    }
  });

  renderColumns();

  document.addEventListener("click", async (e) => {
    if (e.target && e.target.id === "upgrade-button") {
      try {
        const response = await fetch("http://localhost:3000/api/subscribers/upgrade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
  
        if (response.ok) {
          alert("Successfully upgraded to Pro!");
          await updateQueryButtonState(); // Update button state after upgrade
        } else {
          alert("Failed to upgrade. Please try again.");
        }
      } catch (error) {
        console.error("Upgrade error:", error);
        alert("Error upgrading to Pro. Please contact support.");
      }
    }
  });
  
});
