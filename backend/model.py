import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import numpy as np

class WasteDetector:
    def __init__(self):
        print(" Loading waste detection model...")
        
        # Use a standard pre-trained ResNet model from torchvision
        self.model = torch.hub.load('pytorch/vision', 'resnet50', pretrained=True)
        self.model.eval()
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        # Map ImageNet classes to waste categories
        self.waste_keywords = {
            'plastic': ['plastic', 'bottle', 'bag', 'container', 'packaging'],
            'metal': ['can', 'tin', 'aluminum', 'metal', 'frying pan'],
            'glass': ['glass', 'bottle', 'jar', 'vase', 'window'],
            'paper': ['paper', 'cardboard', 'box', 'envelope', 'newspaper'],
            'organic': ['fruit', 'vegetable', 'food', 'leaf', 'banana', 'apple', 'orange'],
            'ewaste': ['phone', 'computer', 'laptop', 'keyboard', 'mouse', 'monitor', 'battery']
        }
        
        print(" Model loaded successfully!")
    
    def detect(self, image_bytes):
        """Detect waste type from image bytes"""
        try:
            # Open and preprocess image
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            input_tensor = self.transform(image)
            input_batch = input_tensor.unsqueeze(0)
            
            # Run inference
            with torch.no_grad():
                output = self.model(input_batch)
            
            # Get predictions
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            
            # Get top 5 predictions
            top5_prob, top5_catid = torch.topk(probabilities, 5)
            
            # Load ImageNet labels
            labels_url = "https://raw.githubusercontent.com/pytorch/hub/master/imagenet_classes.txt"
            import urllib.request
            import json
            
            try:
                with urllib.request.urlopen(labels_url) as f:
                    classes = [line.decode().strip() for line in f.readlines()]
            except:
                # Fallback labels if download fails
                classes = ["object"] * 1000
            
            # Analyze predictions to determine waste type
            waste_scores = {waste_type: 0 for waste_type in self.waste_keywords.keys()}
            
            for i in range(5):
                class_name = classes[top5_catid[i].item()].lower()
                confidence = top5_prob[i].item()
                
                for waste_type, keywords in self.waste_keywords.items():
                    for keyword in keywords:
                        if keyword in class_name:
                            waste_scores[waste_type] += confidence
            
            # Get the waste type with highest score
            if max(waste_scores.values()) > 0:
                waste_type = max(waste_scores, key=waste_scores.get)
                confidence = waste_scores[waste_type]
            else:
                # Default fallback
                waste_type = "general_waste"
                confidence = 0.5
            
            # Normalize confidence to 0-1 range
            confidence = min(confidence, 0.95)
            
            print(f" Detected: {waste_type} (confidence: {confidence:.2%})")
            
            return {
                "waste_type": waste_type,
                "confidence": round(confidence, 3),
                "confidence_level": "high" if confidence > 0.7 else "medium" if confidence > 0.5 else "low",
                "confidence_color": "#10B981" if confidence > 0.7 else "#F59E0B" if confidence > 0.5 else "#EF4444",
                "recommendations": self.get_recommendations(waste_type)
            }
            
        except Exception as e:
            print(f" Detection error: {e}")
            return self.fallback_detection(image_bytes)
    
    def get_recommendations(self, waste_type):
        recommendations = {
            "plastic": [
                " Check for recycling symbol",
                " Clean and dry before recycling",
                " Avoid single-use plastics",
                " Remove labels and caps"
            ],
            "metal": [
                " Crush cans to save space",
                " Metal is infinitely recyclable",
                " Aluminum has scrap value",
                " Remove any plastic parts"
            ],
            "glass": [
                " Rinse before recycling",
                " Glass never loses quality",
                " Remove metal lids/caps",
                " Can be upcycled into decor"
            ],
            "organic": [
                " Start a compost bin",
                " Reduce food waste",
                " Great for worm farming",
                " Use as natural fertilizer"
            ],
            "ewaste": [
                " Contains toxic materials",
                " Wipe all personal data",
                " NEVER dispose in regular trash",
                " Take to certified e-waste center"
            ],
            "paper": [
                " Flatten cardboard boxes",
                " Keep paper dry and clean",
                " Remove plastic windows",
                " Paper can be recycled 5-7 times"
            ],
            "general_waste": [
                " Try the 3 Rs: Reduce, Reuse, Recycle",
                " Dispose responsibly in designated bins",
                " Consider if item can be repurposed"
            ]
        }
        return recommendations.get(waste_type, recommendations["general_waste"])
    
    def fallback_detection(self, image_bytes):
        """Simple color-based detection as fallback"""
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            img_array = np.array(image.resize((100, 100)))
            avg_color = img_array.mean(axis=(0, 1))
            
            # Simple color-based guess
            if avg_color[1] > avg_color[0] and avg_color[1] > avg_color[2]:
                waste_type = "organic"
                confidence = 0.55
            elif avg_color[2] > avg_color[0] and avg_color[2] > avg_color[1]:
                waste_type = "plastic"
                confidence = 0.55
            elif avg_color[0] > 150 and avg_color[1] > 150 and avg_color[2] > 150:
                waste_type = "paper"
                confidence = 0.55
            elif avg_color[0] < 100 and avg_color[1] < 100 and avg_color[2] < 100:
                waste_type = "metal"
                confidence = 0.55
            else:
                waste_type = "general_waste"
                confidence = 0.50
        except:
            waste_type = "general_waste"
            confidence = 0.50
        
        return {
            "waste_type": waste_type,
            "confidence": confidence,
            "confidence_level": "low",
            "confidence_color": "#EF4444",
            "recommendations": self.get_recommendations(waste_type)
        }