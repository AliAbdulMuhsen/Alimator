import streamlit as st
import pandas as pd
from datetime import datetime
import os

# Import models and utilities
from database.db import init_db
from models.project import Project
from models.category import Category
from models.item import Item
from utils.search import Search
from utils.inflation import InflationCalculator
from utils.import_excel import ExcelImporter

# Page configuration
st.set_page_config(
    page_title="Alimator - Cost Management",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize database
if not os.path.exists('alimator.db'):
    init_db()

# Session state initialization
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False

if 'current_page' not in st.session_state:
    st.session_state.current_page = 'home'

# Sidebar navigation
with st.sidebar:
    st.title("🏗️ Alimator")
    st.write("Cost Management System")

    if st.session_state.logged_in:
        st.divider()
        if st.button("📊 Dashboard", use_container_width=True, key="nav_home"):
            st.session_state.current_page = 'home'
        
        if st.button("➕ Add Data", use_container_width=True, key="nav_add_data"):
            st.session_state.current_page = 'add_data'
        
        if st.button("🔍 Search", use_container_width=True, key="nav_search"):
            st.session_state.current_page = 'search'
        
        if st.button("📁 Projects", use_container_width=True, key="nav_projects"):
            st.session_state.current_page = 'projects'
        
        if st.button("📂 Categories", use_container_width=True, key="nav_categories"):
            st.session_state.current_page = 'categories'
        
        st.divider()
        if st.button("🚪 Logout", use_container_width=True, key="btn_logout"):
            st.session_state.logged_in = False
            st.session_state.current_page = 'login'
            st.rerun()

# Page router
if not st.session_state.logged_in:
    # Login page
    st.title("🏗️ Alimator - Cost Management System")
    st.write("Welcome to Alimator. Please login to continue.")
    
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        username = st.text_input("Username", key="login_username")
        password = st.text_input("Password", type="password", key="login_password")
        
        if st.button("Login", use_container_width=True, key="btn_login"):
            # Simple hardcoded credentials (you can use database in production)
            if username == "admin" and password == "password":
                st.session_state.logged_in = True
                st.session_state.current_page = 'home'
                st.success("Logged in successfully!")
                st.rerun()
            else:
                st.error("Invalid credentials")

elif st.session_state.current_page == 'home':
    # Dashboard page
    st.title("📊 Dashboard")
    
    projects = Project.get_all()
    
    if not projects:
        st.info("No projects yet. Create a new project in the 'Projects' section.")
    else:
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Projects", len(projects))
        
        st.subheader("Projects")
        for project in projects:
            with st.expander(f"📁 {project['name']} - {project['date']}"):
                st.write(f"**Description:** {project['description'] or 'N/A'}")
                items = Item.get_by_project(project['id'])
                st.write(f"**Items:** {len(items)}")
                
                if items:
                    st.dataframe(
                        pd.DataFrame(items)[['description', 'unit', 'quantity', 'unit_price', 'total_cost', 'category_name']],
                        use_container_width=True
                    )
                
                if st.button("🗑️ Delete", key=f"delete_project_{project['id']}"):
                    Project.delete(project['id'])
                    st.success("Project deleted")
                    st.rerun()

elif st.session_state.current_page == 'projects':
    # Projects management page (separate from Add Data)
    st.title("📁 Projects")
    
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Add New Project")
        new_name = st.text_input("Project Name", key="proj_name")
        new_date = st.date_input("Project Date", key="proj_date")
        new_desc = st.text_area("Project Description", key="proj_desc")
        if st.button("Create Project", key="btn_create_project"):
            if not new_name:
                st.error("Please enter project name")
            else:
                Project.create(new_name, new_desc or '', str(new_date))
                st.success(f"Project '{new_name}' created")
                st.rerun()
    
    with col2:
        st.subheader("Existing Projects")
        projects = Project.get_all()
        if projects:
            df = pd.DataFrame(projects)
            st.dataframe(df[['id', 'name', 'date']], use_container_width=True)
        else:
            st.info("No projects yet")

elif st.session_state.current_page == 'add_data':
    # Add Data page
    st.title("➕ Add Data")
    
    tab1, tab2 = st.tabs(["Import Excel", "Manual Entry"])
    
    # Get projects for selection
    projects = Project.get_all()
    project_options = {p['name']: p['id'] for p in projects}

    # Tab 1: Import Excel
    with tab1:
        st.subheader("Import BOQ from Excel")
        
        # Download template button
        if st.button("⬇️ Download Template", key="btn_download_template"):
            template_path = ExcelImporter.create_template()
            with open(template_path, 'rb') as f:
                st.download_button(
                    label="Click here to download",
                    data=f.read(),
                    file_name="BOQ_Template.xlsx",
                    mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
        
        st.write("Expected columns: Description, Unit, Quantity, Unit Price, Category (optional)")
        
        col1, col2 = st.columns(2)
        with col1:
            if projects:
                selected_project_name = st.selectbox("Select Project", ["-- Select --"] + list(project_options.keys()), key="import_select_project")
            else:
                st.info("No projects available. Create a project first in Projects page.")
                selected_project_name = ""
        with col2:
            st.write("")
            if st.button("Create Project", key="btn_create_project_from_import"):
                st.session_state.current_page = 'projects'
                st.rerun()
        
        uploaded_file = st.file_uploader("Choose Excel file", type=['xlsx', 'xls'], key="file_uploader")
        
        if st.button("Import", key="btn_import"):
            if not selected_project_name or selected_project_name == "-- Select --":
                st.error("Please select a project")
            elif not uploaded_file:
                st.error("Please select a file")
            else:
                project_id = project_options.get(selected_project_name)
                success, message = ExcelImporter.import_boq(
                    uploaded_file,
                    selected_project_name,
                    ''
                )
                if success:
                    st.success(message)
                else:
                    st.error(message)

elif st.session_state.current_page == 'search':
    # Search page
    st.title("🔍 Search Items")
    
    col1, col2, col3 = st.columns(3)
    
    # Category filter
    with col1:
        categories = Category.get_all()
        category_options = {"All Categories": None}
        for cat in categories:
            category_options[cat['name']] = cat['id']
        
        selected_category_name = st.selectbox(
            "Select Category",
            list(category_options.keys()),
            key="search_category"
        )
        selected_category_id = category_options[selected_category_name]
    
    # Item search (writable input with autocomplete suggestions)
    with col2:
        search_item_text = st.text_input("Search Item", key="search_item_text")
        suggestions = []
        if len(search_item_text or '') >= 2:
            suggestions = Search.autocomplete(search_item_text, selected_category_id, limit=10)
        # Render suggestions as buttons
        if suggestions:
            sugg_cols = st.columns(3)
            for idx, sugg in enumerate(suggestions):
                c = sugg_cols[idx % 3]
                if c.button(sugg, key=f"sugg_{idx}"):
                    st.session_state.search_item_text = sugg
                    st.session_state.perform_search = True
                    st.experimental_rerun()

    # Search button
    with col3:
        if st.button("🔍 Search", key="btn_search"):
            st.session_state.perform_search = True

    # Inflation controls
    st.divider()
    col1, col2, col3 = st.columns(3)
    
    with col1:
        inflation_rate = st.slider("Annual Inflation Rate (%)", 0.0, 50.0, 0.0, 0.1, key="inflation_rate")
    
    with col2:
        reference_year = st.number_input("Adjust To Year", min_value=2000, max_value=2100, value=datetime.now().year, key="reference_year")
    
    st.divider()
    
    # Perform search
    if st.session_state.get('perform_search', False) and st.session_state.get('search_item_text'):
        search_item = st.session_state.get('search_item_text')
        results = Search.search_items(search_item, selected_category_id)
        
        if not results:
            st.info("This item was not found in the database.")
        else:
            st.subheader(f"Results for: {results['description']}")
            
            # Statistics
            col1, col2, col3, col4 = st.columns(4)
            stats = results['statistics']
            
            with col1:
                st.metric("Occurrences", stats['occurrences'])
            with col2:
                avg_price = stats['average_price']
                adjusted_avg = InflationCalculator.calculate_adjusted_price(
                    avg_price, f"{reference_year}-01-01", reference_year, inflation_rate
                )
                st.metric("Avg Price", f"${avg_price:.2f}", delta=f"${adjusted_avg:.2f}" if inflation_rate > 0 else None)
            with col3:
                min_price = stats['min_price']
                st.metric("Min Price", f"${min_price:.2f}")
            with col4:
                max_price = stats['max_price']
                st.metric("Max Price", f"${max_price:.2f}")
            
            # Price history table
            st.subheader("Price History")
            
            table_data = []
            for row in results['results']:
                adjusted_price = InflationCalculator.calculate_adjusted_price(
                    row['unit_price'],
                    row['project_date'],
                    reference_year,
                    inflation_rate
                )
                years_diff = InflationCalculator.get_year_difference(row['project_date'], reference_year)
                
                table_data.append({
                    'Project': row['project_name'],
                    'Date': row['project_date'],
                    'Unit': row['unit'],
                    'Original Price': f"${float(row['unit_price']):.2f}",
                    'Adjusted Price': f"${adjusted_price:.2f}" if inflation_rate > 0 else "-",
                    'Years': years_diff
                })
            
            df = pd.DataFrame(table_data)
            st.dataframe(df, use_container_width=True)

    st.session_state.perform_search = False

elif st.session_state.current_page == 'categories':
    # Categories management page
    st.title("📂 Categories")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Add New Category")
        new_category_name = st.text_input("Category Name", key="new_cat_name")
        new_category_desc = st.text_area("Description (optional)", key="new_cat_desc")
        
        if st.button("Add Category", key="btn_add_category"):
            if new_category_name:
                result = Category.create(new_category_name, new_category_desc)
                if result:
                    st.success(f"Category '{new_category_name}' added!")
                    st.rerun()
                else:
                    st.error("Category already exists")
            else:
                st.error("Please enter category name")

with functions.create_or_update_file <>