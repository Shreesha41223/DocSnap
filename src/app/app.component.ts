import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'doc-snap';

  selectedLanguage: string = 'English';
  apiResponse: string = '';
  isLoading: boolean = false;
  selectedFileName: string = '';
  selectedFile: File | null = null;
  filePreview: string | ArrayBuffer | null = null;
  API_KEY: string = 'AIzaSyBSgK8w0l0g9Aym2lWeFdvP9k_dTpQU_JY';

  async fileToGenerativePart(file: File): Promise<any> {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  }

  async analyzePrescription() {
    this.isLoading = true;
    const model = new GoogleGenerativeAI(this.API_KEY).getGenerativeModel({
      model: 'gemini-pro-vision'
    });

    const fileInputEl = document.querySelector<HTMLInputElement>("#prescriptionImage");
    if (fileInputEl && fileInputEl.files) {
      const filesArray = Array.from(fileInputEl.files);  // Convert FileList to array
      const imageParts = await Promise.all(filesArray.map(file => this.fileToGenerativePart(file)));
      const prompt = `
        You are called DocSnap, an expert in biology and medicines. 
        You help patients read their prescriptions more easily and are not a medical advisor. 
        You provide details and information of the same prescription. The user uploads an image of their prescription. 
        You analyze the image to identify medication details (excluding doctor instructions etc.) and distinguish them with dosage information (mg, tab etc.). 
        For each medicine, you explain the name (active ingredient and brand name if applicable), dosage, and side effects in the user's preferred language 
        (including Kannada and Hindi without English translation). 
        The information should be presented in the following HTML format:
        
        <div class="medicine">
          <h3>Medicine Name: [Medicine Name]</h3>
          <p>Active Ingredient: [Active Ingredient]</p>
          <p>Dosage: [Dosage]</p>
          <p>Side Effects: [Side Effects]</p>
        </div>
        
        If the image doen't contain any medicine name respond:
        <div class="medicine">
          <h3>NO MEDICINE IDENTIFIED!!</h3>
        </div>
        The user's selected language is ${this.selectedLanguage}.
      `;
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      this.apiResponse = await response.text();
    }
    this.isLoading = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;

      const reader = new FileReader();
      reader.onload = () => {
        this.filePreview = reader.result;
      };
      reader.readAsDataURL(file);

      this.apiResponse = '';
    }
  }

  clearFile() {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.filePreview = null;
    const fileInputEl = document.querySelector<HTMLInputElement>("#prescriptionImage");
    if (fileInputEl) {
      fileInputEl.value = '';
    }
    this.apiResponse = '';
  }
}
