### 📂 Plugins Directory

Welcome to the `plugins` directory! This is where various plugins extend the functionality of the project.

## 🔧 Adding a UI Plugin to the Repository

If you are developing a **UI plugin** that **should remain in the main repository** (and is not intended to be moved to a separate repository), make sure it is **not ignored by Git**.

### 🚀 How to Add a Plugin to the Main Repository?

1. **Open the `.gitignore` file**
2. **Add an exception** for your plugin:

   ```gitignore
   /src/plugins/*
   !/src/plugins/your-plugin-name/
   ```

   🔹 Replace `your-plugin-name` with your actual folder name.

3. **Add the plugin to Git:**
   ```sh
   git add -f src/plugins/your-plugin-name/
   git commit -m "Added UI plugin your-plugin-name"
   ```

### ❗ Important

If you plan to make the plugin a separate repository, you should not add it to gitignore.

📌 **Don't forget to update the documentation** for your plugin if it requires special integration instructions.

🚀 **Happy coding!**
