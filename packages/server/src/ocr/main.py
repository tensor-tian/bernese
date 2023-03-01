#!/Users/jinmao/miniconda3/bin/python

import easyocr
import os
import sys

img_file = sys.argv[1]
img_dir = os.path.dirname(img_file)

print(img_file, img_dir);

reader = easyocr.Reader(["ch_sim", "en"])
result = reader.readtext(img_file, detail=0)

result_file_easyocr = open(img_file + ".easyocr.txt", "w")
content1 = "".join(result)
result_file_easyocr.write(content1)
result_file_easyocr.close()

dest=img_file+".tesseract"

cmd = "tesseract {src} {dest} --oem 1 -l chi_sim+eng".format(src=img_file, dest=dest)
os.system(cmd)

dest=dest+".txt"
result_file_tesseract_read = open(dest, "r")
content2 = ''.join(result_file_tesseract_read.read().split(' '))
result_file_tesseract_write = open(dest, "w")
result_file_tesseract_write.write(content2)
