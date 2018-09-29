#!/usr/bin/env python3
# ==============================================================================
# convert eduroam database old format to new format
# parameters:
# 1) directory with institution.xml files
# 2) directory where to output corresponding converted json files
# ==============================================================================

# imports
# ==============================================================================
import sys
import os
# ==============================================================================

# ==============================================================================
# usage
# ==============================================================================
def usage():
  print("usage:")
  print(sys.argv[0] + " input_dir output_dir")

# ==============================================================================
# ==============================================================================
def list_files(input_dir):
  files = []

  for f in os.listdir(input_dir):
    if(f.endswith(".xml")):
      files.append(f)

  return files

# ==============================================================================
# convert files 
# ==============================================================================
#def convert():


# ==============================================================================
# main function
# ==============================================================================
def main():
  if(len(sys.argv) != 3):
    usage()
    sys.exit(1)

  input_dir = sys.argv[1]
  output_dir = sys.argv[2]

  input_list = list_files(input_dir)
  print(input_list)

# ==============================================================================
# program is run directly, not included
# ==============================================================================
if __name__ == "__main__":
  main()
