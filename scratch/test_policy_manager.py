#!/usr/bin/env python3
import sys
import os
import json
import unittest

# Import functions from scripts/manage_policies.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../scripts")))
from manage_policies import deep_union_schema, deep_align, deep_copy_none

class TestPolicyManager(unittest.TestCase):
    
    def test_deep_union_schema(self):
        dict1 = {
            "name": "Bank A",
            "ltv": 0.8,
            "details": {
                "age": 80,
                "notes": "some notes"
            }
        }
        dict2 = {
            "name": "Bank B",
            "details": {
                "age": 75,
                "seniority": 24
            },
            "extra": "value"
        }
        
        expected_union = {
            "name": None,
            "ltv": None,
            "details": {
                "age": None,
                "notes": None,
                "seniority": None
            },
            "extra": None
        }
        
        union = deep_union_schema([dict1, dict2])
        self.assertEqual(union, expected_union)
        
    def test_deep_align(self):
        template = {
            "name": None,
            "ltv": None,
            "details": {
                "age": None,
                "notes": None,
                "seniority": None
            },
            "extra": None
        }
        
        data = {
            "name": "Bank A",
            "ltv": 0.8,
            "details": {
                "age": 80,
                "notes": "some notes"
            }
        }
        
        expected_aligned = {
            "name": "Bank A",
            "ltv": 0.8,
            "details": {
                "age": 80,
                "notes": "some notes",
                "seniority": None
            },
            "extra": None
        }
        
        aligned = deep_align(data, template)
        self.assertEqual(aligned, expected_aligned)

    def test_deep_align_with_mismatched_types(self):
        # If template expects a dict for details, but data has null
        template = {
            "details": {
                "age": None,
                "notes": None
            }
        }
        data = {
            "details": None
        }
        expected_aligned = {
            "details": {
                "age": None,
                "notes": None
            }
        }
        aligned = deep_align(data, template)
        self.assertEqual(aligned, expected_aligned)

if __name__ == "__main__":
    unittest.main()
