from backend.process import pose_processor
from backend.process import voice_processor
from backend.process import render_processor
from backend.process import animate_processor


class Processor:
    def __init__(self):
        self.pose_processor = pose_processor.PoseProcessor()
        self.voice_processor = voice_processor.VoiceProcessor()
        self.animate_processor = animate_processor.AnimateProcessor()
        self.render_processor = render_processor.RenderProcessor()

    def process(self, filename):
        data = self.pose_processor.process(filename)
        data = self.voice_processor.process(data)
        data = self.animate_processor.process(data)
        data = self.render_processor.process(data)
        return data
