#!/usr/bin/env python3
"""
CareVision — Test Image Setup Script
Run this once to copy generated test images into test_images/
"""

import shutil
import os

BRAIN_DIR = '/home/ibadat/.gemini/antigravity/brain/639a2545-c818-40f0-b81d-1d3040ff73c4'
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DST_DIR = os.path.join(PROJECT_ROOT, 'test_images')

FILES = {
    'teststrip_malaria_positive_1777144200300.png':    'teststrip_malaria_POSITIVE.png',
    'teststrip_covid_negative_1777144216807.png':      'teststrip_covid19_NEGATIVE.png',
    'medscan_amoxicillin_packaging_1777144235706.png': 'medscan_amoxicillin_blister.png',
    'medscan_metformin_bottle_1777144253127.png':      'medscan_metformin_bottle.png',
    'wound_severity_2_laceration_1777144294230.png':   'woundassess_severity2_laceration.png',
    'wound_severity_3_infected_1777144311675.png':     'woundassess_severity3_infected.png',
    'docreader_patient_record_1777144326714.png':      'docreader_patient_record.png',
    'docreader_lab_report_1777144343059.png':          'docreader_cbc_lab_report.png',
}

os.makedirs(DST_DIR, exist_ok=True)
print(f'Target: {DST_DIR}\n')

for src_name, dst_name in FILES.items():
    src = os.path.join(BRAIN_DIR, src_name)
    dst = os.path.join(DST_DIR, dst_name)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        size_kb = os.path.getsize(dst) // 1024
        print(f'  ✓  {dst_name}  ({size_kb}KB)')
    else:
        print(f'  ✗  MISSING: {src_name}')

print(f'\nDone — {len(os.listdir(DST_DIR))} files in test_images/')
