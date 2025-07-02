import os
import re
import subprocess

# ==============================================================================
# SECTION 1: PROJECT CONFIGURATION (THE BLUEPRINT)
# ==============================================================================
# This is the main configuration for our build process.
# We define all our source paths and output directories here.

# The root directory for all our source code.
SRC_DIR = 'src'
# The directory where the final, ready-to-use Anki files will be placed.
BUILD_DIR = '_build'
# The directory containing our individual SVG icon files.
ICONS_DIR = os.path.join(SRC_DIR, 'assets', 'icons')

# A list of all the templates we want to build. Each item is a dictionary
# that tells the script where to find the pieces for each template.
TEMPLATES_CONFIG = [
    {
        'name': 'basic',
        'js_dir': 'basic',
        'scss_file': 'basic.scss'
    },
    {
        'name': 'cloze',
        'js_dir': 'cloze',
        'scss_file': 'cloze.scss'
    }
]


# ==============================================================================
# SECTION 2: THE ROBOT'S FUNCTIONS (THE ASSEMBLY LINE)
# ==============================================================================

def inject_svgs(content):
    """
    Finds all SVG placeholders (e.g., <!-- %%SVG:play%% -->) in a string
    and replaces them with the actual content of the corresponding .svg file.
    """
    # Find all occurrences of the placeholder pattern.
    svg_placeholders = re.findall(r'<!-- %%SVG:(.*?)%% -->', content)
    
    for icon_name in svg_placeholders:
        icon_path = os.path.join(ICONS_DIR, f"{icon_name}.svg")
        try:
            with open(icon_path, 'r', encoding='utf-8') as f:
                # Read the SVG content and clean it up for embedding.
                svg_content = f.read().replace('\n', ' ').replace('\r', ' ').strip()
            
            # Define the exact placeholder string to be replaced.
            placeholder = f'<!-- %%SVG:{icon_name}%% -->'
            # Replace the placeholder with the actual SVG code.
            content = content.replace(placeholder, svg_content)
        except FileNotFoundError:
            # If an icon file is missing, print a warning but don't stop the build.
            print(f"⚠️  Warning: Icon file '{icon_name}.svg' not found. Placeholder will remain.")
            
    return content

def assemble_html_files(config):
    """
    Takes a template configuration, reads all its pieces (HTML shell, JS, and
    the already-compiled CSS), and assembles the final front.html and back.html.
    """
    template_name = config['name']
    print(f"📦 Assembling HTML for '{template_name}'...")
    
    # Define the full paths to all the necessary source files.
    front_js_path = os.path.join(SRC_DIR, 'js', config['js_dir'], 'front.js')
    back_js_path = os.path.join(SRC_DIR, 'js', config['js_dir'], 'back.js')
    front_template_path = os.path.join(SRC_DIR, 'templates', template_name, '_front.html')
    back_template_path = os.path.join(SRC_DIR, 'templates', template_name, '_back.html')
    style_path = os.path.join(BUILD_DIR, template_name, 'styling.css')

    try:
        # Read the content of all the pieces.
        with open(front_js_path, 'r', encoding='utf-8') as f:
            front_script = inject_svgs(f.read()) # Inject SVGs into the JS content.
        with open(back_js_path, 'r', encoding='utf-8') as f:
            back_script = inject_svgs(f.read()) # Inject SVGs into the JS content.
        with open(front_template_path, 'r', encoding='utf-8') as f:
            front_base = f.read()
        with open(back_template_path, 'r', encoding='utf-8') as f:
            back_base = f.read()
        with open(style_path, 'r', encoding='utf-8') as f:
            styles = f.read()

        # Assemble the final HTML by replacing the placeholders in the shells.
        final_front = front_base.replace('<!-- %%STYLES%% -->', styles).replace('<!-- %%SCRIPT%% -->', front_script)
        final_back = back_base.replace('<!-- %%STYLES%% -->', styles).replace('<!-- %%SCRIPT%% -->', back_script)

        # Write the final, assembled HTML files to the build directory.
        with open(os.path.join(BUILD_DIR, template_name, 'front.html'), 'w', encoding='utf-8') as f:
            f.write(final_front)
        with open(os.path.join(BUILD_DIR, template_name, 'back.html'), 'w', encoding='utf-8') as f:
            f.write(final_back)
        
        print(f"✅ HTML for '{template_name}' assembled successfully.")
    except FileNotFoundError as e:
        print(f"❌ Error during HTML assembly: {e}. Check if all source files exist.")

def main():
    """
    The main function that directs the entire build process from start to finish.
    """
    print("🏭 Starting the professional Anki template build process...")
    
    # 1. Ensure the output directories exist.
    for cfg in TEMPLATES_CONFIG:
        os.makedirs(os.path.join(BUILD_DIR, cfg['name']), exist_ok=True)

    # 2. Command the 'npm' factory to compile the SCSS into CSS.
    print("\n💅 Compiling SCSS to CSS using the 'sass' machine...")
    try:
        # 'subprocess.run' executes a terminal command from within Python.
        # 'shell=True' helps with compatibility, especially on Windows.
        subprocess.run("npm run build:css", check=True, shell=True)
        print("✅ CSS compiled successfully.")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"❌ CRITICAL ERROR: Could not compile CSS. Did you run 'npm install'?")
        print(f"   Error details: {e}")
        return

    # 3. Command our own assembly line to build the final HTML files.
    print("\n📦 Starting HTML assembly...")
    for config in TEMPLATES_CONFIG:
        assemble_html_files(config)

    print("\n🎉 Build process completed! Your professional templates are ready in the '_build' folder.")

# This ensures the 'main' function is called only when the script is executed directly.
if __name__ == "__main__":
    main()