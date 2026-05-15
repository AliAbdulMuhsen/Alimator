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
        st.info("No projects yet. Create a new project in the 'Add Data' section.")
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

elif st.session_state.current_page == 'add_data':
    # Add Data page
    st.title("➕ Add Data")
    
    tab1, tab2 = st.tabs(["Import Excel", "Manual Entry"])
    
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
            project_name = st.text_input("Project Name", key="import_project_name")
        with col2:
            project_date = st.date_input("Project Date", key="import_project_date")
        
        uploaded_file = st.file_uploader("Choose Excel file", type=['xlsx', 'xls'], key="file_uploader")
        
        if st.button("Import", key="btn_import"):
            if not project_name:
                st.error("Please enter project name")
            elif not uploaded_file:
                st.error("Please select a file")
            else:
                success, message = ExcelImporter.import_boq(
                    uploaded_file,
                    project_name,
                    str(project_date)
                )
                if success:
                    st.success(message)
                else:
                    st.error(message)
    
    # Tab 2: Manual Entry
    with tab2:
        st.subheader("Add Items Manually")
        
        col1, col2 = st.columns(2)
        with col1:
            project_name = st.text_input("Project Name", key="manual_project_name")
        with col2:
            project_date = st.date_input("Project Date", key="manual_project_date")
        
        project_desc = st.text_area("Project Description (optional)", key="manual_project_desc")
        
        st.divider()
        st.subheader("Items")
        
        # Get categories
        categories = Category.get_all()
        category_names = ["None"] + [c['name'] for c in categories]
        
        num_items = st.slider("Number of items", 1, 10, 1, key="num_items")
        
        items_data = []
        for i in range(num_items):
            col1, col2, col3, col4, col5 = st.columns(5)
            with col1:
                desc = st.text_input("Description", key=f"desc_{i}")
            with col2:
                unit = st.text_input("Unit", value="m³", key=f"unit_{i}")
            with col3:
                qty = st.number_input("Quantity", min_value=0.0, step=0.1, key=f"qty_{i}")
            with col4:
                price = st.number_input("Unit Price", min_value=0.0, step=0.01, key=f"price_{i}")
            with col5:
                cat = st.selectbox("Category", category_names, key=f"cat_{i}")
            
            items_data.append({
                'description': desc,
                'unit': unit,
                'quantity': qty,
                'unit_price': price,
                'category': cat if cat != "None" else None
            })
        
        if st.button("Save Project & Items", key="btn_save_manual"):
            if not project_name:
                st.error("Please enter project name")
            elif not all(item['description'] for item in items_data):
                st.error("All items must have a description")
            else:
                project_id = Project.create(project_name, project_desc or "", str(project_date))
                
                for item in items_data:
                    category_id = None
                    if item['category']:
                        category_id = Category.get_by_name(item['category'])
                    
                    Item.create(
                        project_id,
                        item['description'],
                        item['unit'],
                        item['quantity'],
                        item['unit_price'],
                        category_id
                    )
                
                st.success(f"Project '{project_name}' created with {num_items} items!")

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
    
    # Item search
    with col2:
        if selected_category_id:
            item_suggestions = Search.get_items_by_category(selected_category_id)
        else:
            item_suggestions = Search.autocomplete("", None, limit=100)
        
        search_item = st.selectbox(
            "Search Item",
            item_suggestions + [""],
            key="search_item_input",
            help="Start typing or select from dropdown"
        )
    
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
    if st.session_state.get('perform_search', False) and search_item:
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
    
    with col2:
        st.subheader("Existing Categories")
        categories = Category.get_all()
        if categories:
            df = pd.DataFrame(categories)
            st.dataframe(df, use_container_width=True, hide_index=True)
        else:
            st.info("No categories yet")
