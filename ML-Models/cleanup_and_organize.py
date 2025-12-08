#!/usr/bin/env python3
"""
Cleanup and Organize ML-Models Directory
Reorganizes files into proper folder structure and removes unnecessary files
"""

import os
import shutil
from pathlib import Path

print("="*70)
print("ML-MODELS DIRECTORY CLEANUP")
print("="*70)

# Get the current directory
base_dir = Path(__file__).parent

# Define new folder structure
folders_to_create = [
    'scripts',
    'utils',
    'docs',
    'archive'
]

# File movements
file_moves = {
    # Scripts
    'validate_ieee_cis.py': 'scripts/validate_ieee_cis.py',
    
    # Utils
    'check_mongodb_results.py': 'utils/check_mongodb_results.py',
    'extract_mccs_results.py': 'utils/extract_mccs_results.py',
    'retrieve_models_from_mongodb.py': 'utils/retrieve_models_from_mongodb.py',
    
    # Docs
    'MCCS_vs_IEEE_COMPARISON.md': 'docs/MCCS_vs_IEEE_COMPARISON.md',
    'METHODOLOGY_VALIDATION_REPORT.md': 'docs/METHODOLOGY_VALIDATION_REPORT.md',
    'DEMO_SCRIPT.md': 'docs/DEMO_SCRIPT.md',
    
    # Archive
    'PBL_Group1_PreProcessing.ipynb': 'archive/PBL_Group1_PreProcessing.ipynb',
}

# Files to delete
files_to_delete = [
    'test.py',
    'PBL_Group1_PreProcessing_sid.ipynb',
    'CLEANUP_PLAN.md',  # This plan file itself
    'cleanup_and_organize.py',  # This script itself (after execution)
]

# Large data files to delete (optional - ask user)
large_data_files = [
    'train_transaction.csv',
    'test_transaction.csv',
    'train_identity.csv',
    'test_identity.csv',
    'sample_submission.csv',
]

def create_folders():
    """Create new folder structure"""
    print("\n[1/4] Creating folder structure...")
    for folder in folders_to_create:
        folder_path = base_dir / folder
        if not folder_path.exists():
            folder_path.mkdir(parents=True, exist_ok=True)
            print(f"  ✅ Created: {folder}/")
        else:
            print(f"  ℹ️  Exists: {folder}/")

def move_files():
    """Move files to new locations"""
    print("\n[2/4] Moving files to new structure...")
    for source, dest in file_moves.items():
        source_path = base_dir / source
        dest_path = base_dir / dest
        
        if source_path.exists():
            # Create parent directory if it doesn't exist
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Move the file
            shutil.move(str(source_path), str(dest_path))
            print(f"  ✅ Moved: {source} → {dest}")
        else:
            print(f"  ⚠️  Not found: {source}")

def delete_small_files():
    """Delete unnecessary small files"""
    print("\n[3/4] Deleting unnecessary files...")
    for file in files_to_delete:
        file_path = base_dir / file
        if file_path.exists():
            file_path.unlink()
            print(f"  ✅ Deleted: {file}")
        else:
            print(f"  ℹ️  Not found: {file}")

def delete_large_files():
    """Delete large IEEE-CIS data files"""
    print("\n[4/4] Checking large data files...")
    
    total_size = 0
    for file in large_data_files:
        file_path = base_dir / file
        if file_path.exists():
            size_mb = file_path.stat().st_size / (1024 * 1024)
            total_size += size_mb
            print(f"  📊 {file}: {size_mb:.1f} MB")
    
    if total_size > 0:
        print(f"\n  💾 Total size: {total_size:.1f} MB ({total_size/1024:.2f} GB)")
        response = input("\n  ⚠️  Delete these large files? (yes/no): ").strip().lower()
        
        if response == 'yes':
            for file in large_data_files:
                file_path = base_dir / file
                if file_path.exists():
                    file_path.unlink()
                    print(f"  ✅ Deleted: {file}")
            print(f"\n  💾 Freed up {total_size:.1f} MB ({total_size/1024:.2f} GB)")
        else:
            print("  ℹ️  Skipped deletion of large files")
    else:
        print("  ℹ️  No large data files found")

def show_final_structure():
    """Display the final directory structure"""
    print("\n" + "="*70)
    print("FINAL DIRECTORY STRUCTURE")
    print("="*70)
    
    def print_tree(directory, prefix="", max_depth=2, current_depth=0):
        if current_depth >= max_depth:
            return
        
        try:
            entries = sorted(directory.iterdir(), key=lambda x: (not x.is_dir(), x.name))
            for i, entry in enumerate(entries):
                is_last = i == len(entries) - 1
                current_prefix = "└── " if is_last else "├── "
                print(f"{prefix}{current_prefix}{entry.name}")
                
                if entry.is_dir() and entry.name not in ['.git', '__pycache__', 'node_modules']:
                    extension = "    " if is_last else "│   "
                    print_tree(entry, prefix + extension, max_depth, current_depth + 1)
        except PermissionError:
            pass
    
    print_tree(base_dir)

def main():
    """Main cleanup function"""
    try:
        create_folders()
        move_files()
        delete_small_files()
        delete_large_files()
        show_final_structure()
        
        print("\n" + "="*70)
        print("✅ CLEANUP COMPLETE!")
        print("="*70)
        print("\nNext steps:")
        print("  1. Review the new folder structure")
        print("  2. Check that all files are in the right place")
        print("  3. Read README.md for usage instructions")
        print("  4. Consider committing changes to git")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
