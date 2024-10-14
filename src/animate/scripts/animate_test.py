import bpy
import csv
import os

folder_path = os.getcwd()
filename = os.path.join(folder_path, "src/assets/animate_test.csv")

obj = bpy.context.active_object


obj = bpy.data.objects["rig"]


pb = obj.pose.bones.get("c_foot_ik.r")

with open(filename, newline='') as file:
    reader = csv.reader(file, delimiter=",")
    for i, row in enumerate(reader):
        fn = i
        loc = (float(row[0]), float(row[1]), float(row[2]))
        rot = (float(row[3]), float(row[4]), float(row[5]))

        pb.location = loc
        pb.rotation_euler = rot
        pb.keyframe_insert(data_path="location", frame=fn)
        pb.keyframe_insert(data_path="rotation_euler", frame=fn)
