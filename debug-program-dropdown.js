// Script to debug the program dropdown issue
console.log("Debugging program dropdown issue");

// Function to check the campus ID and program data
async function checkCampusAndPrograms() {
  try {
    // Extract campus ID from URL
    const url = window.location.pathname;
    const campusIdMatch = url.match(/\/admin\/system\/campuses\/([^\/]+)\/programs\/assign/);
    
    if (!campusIdMatch) {
      console.error("Could not extract campus ID from URL");
      return;
    }
    
    const campusId = campusIdMatch[1];
    console.log("Campus ID:", campusId);
    
    // Check if there are available programs in the DOM
    const selectElement = document.querySelector('select');
    if (!selectElement) {
      console.error("Select element not found");
      return;
    }
    
    console.log("Select element disabled state:", selectElement.disabled);
    
    // Check select content
    const selectItems = document.querySelectorAll('select option');
    console.log("Number of options:", selectItems.length);
    
    // Log each option
    selectItems.forEach(option => {
      console.log("Option:", option.value, option.textContent, option.disabled);
    });
    
    // Check if there's a "No available programs" message
    const noPrograms = Array.from(selectItems).find(option => 
      option.textContent.includes("No available programs")
    );
    
    if (noPrograms) {
      console.log("Found 'No available programs' message");
    }
    
    // Check the availablePrograms array in the component props
    console.log("Checking React component props...");
    // This is more complex and would require React DevTools integration
  } catch (error) {
    console.error("Error in debug script:", error);
  }
}

// Run the check when the page is loaded
window.addEventListener('load', () => {
  console.log("Page loaded, running checks...");
  setTimeout(checkCampusAndPrograms, 1000); // Give React time to render
});

// Also check when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded, running checks...");
  setTimeout(checkCampusAndPrograms, 1000);
});
