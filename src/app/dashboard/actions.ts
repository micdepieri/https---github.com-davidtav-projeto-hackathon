
'use server';

import {
  diagnoseUrbanHeatIslands,
  type DiagnoseUrbanHeatIslandsInput,
  type DiagnoseUrbanHeatIslandsOutput,
} from '@/ai/flows/diagnose-urban-heat-islands';
import {
  generatePlantingRecommendations,
  type GeneratePlantingRecommendationsInput,
  type GeneratePlantingRecommendationsOutput,
} from '@/ai/flows/generate-planting-recommendations';
import {
  generateClimatePlan,
  type GenerateClimatePlanInput,
  type GenerateClimatePlanOutput,
} from '@/ai/flows/generate-climate-plan';
import {
    getUrbanHeatIslandData,
} from '@/ai/flows/get-urban-heat-island-data';
import { z } from 'zod';
import { addDoc, collection, getDocs, writeBatch, doc, updateDoc, setDoc, getDoc, serverTimestamp, query, where, Timestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { format } from 'date-fns';


// Firebase Admin Initialization for Server Actions
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirestoreInstance() {
    if (getApps().length === 0) {
        initializeApp(firebaseConfig);
    }
    return getFirestore(getApp());
}


const diagnoseSchema = z.object({
  municipalityDescription: z
    .string()
    .min(1, 'A descrição do município é obrigatória.'),
  municipalityName: z.string().min(1, 'O nome do município é obrigatório.'),
});

export async function runDiagnostics(
  formData: FormData
): Promise<{
  success: boolean;
  data?: {
    output: DiagnoseUrbanHeatIslandsOutput;
    input: DiagnoseUrbanHeatIslandsInput;
  };
  error?: string;
}> {
  const parsed = diagnoseSchema.safeParse({
    municipalityDescription: formData.get('municipalityDescription'),
    municipalityName: formData.get('municipalityName'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    };
  }

  try {
    // Step 1: Get data from Earth Engine flow
    console.log(`Getting Earth Engine data for ${parsed.data.municipalityName}`);
    const earthEngineData = await getUrbanHeatIslandData({ municipalityName: parsed.data.municipalityName });
    console.log('Successfully got Earth Engine data');

    // Step 2: Pass the data to the diagnostics flow
    const diagnosticsInput: DiagnoseUrbanHeatIslandsInput = {
      municipalityDescription: parsed.data.municipalityDescription,
      ndviDataUri: earthEngineData.ndviDataUri,
      lstDataUri: earthEngineData.lstDataUri,
      populationDensityData: earthEngineData.populationDensityData,
      infrastructureData: earthEngineData.infrastructureData,
    };

    console.log('Running diagnostics flow');
    const result = await diagnoseUrbanHeatIslands(diagnosticsInput);
    console.log('Successfully ran diagnostics flow');
    return { success: true, data: { output: result, input: diagnosticsInput } };
  } catch (error: any) {
    console.error("Detailed error in runDiagnostics:", error);
    const errorMessage = error.message || 'Ocorreu um erro durante o diagnóstico.';
    return { success: false, error: errorMessage };
  }
}

export async function runRecommendations(
  input: GeneratePlantingRecommendationsInput
): Promise<{
  success: boolean;
  data?: GeneratePlantingRecommendationsOutput;
  error?: string;
}> {
  try {
    const result = await generatePlantingRecommendations(input);
    return { success: true, data: result };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message || 'Falha ao gerar recomendações' };
  }
}

export async function runPlanGeneration(
  input: GenerateClimatePlanInput
): Promise<{
  success: boolean;
  data?: GenerateClimatePlanOutput;
  error?: string;
}> {
  try {
    const result = await generateClimatePlan(input);
    return { success: true, data: result };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message || 'Falha ao gerar o plano' };
  }
}

const addCitySchema = z.object({
  cityName: z.string().min(3, 'O nome da cidade é obrigatório.'),
});

export async function addCity(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = addCitySchema.safeParse({
    cityName: formData.get('cityName'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    };
  }

  try {
    const firestore = getFirestoreInstance();
    await addDoc(collection(firestore, 'cities'), {
      name: parsed.data.cityName,
    });
    return { success: true };
  } catch (e: any) {
    console.error('Failed to add city:', e);
    return { success: false, error: e.message || 'Falha ao adicionar cidade.' };
  }
}

export async function importBrazilianCities(): Promise<{ success: boolean, error?: string, message?: string }> {
    try {
        const firestore = getFirestoreInstance();
        const citiesRef = collection(firestore, 'cities');
        const citiesSnapshot = await getDocs(citiesRef);

        if (!citiesSnapshot.empty) {
            return { success: true, message: 'Os municípios já foram importados anteriormente.' };
        }

        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
        if (!response.ok) {
            throw new Error('Falha ao buscar municípios da API do IBGE.');
        }
        const municipalities = await response.json();

        const batch = writeBatch(firestore);
        municipalities.forEach((municipality: any) => {
            const cityName = `${municipality.nome} - ${municipality.microrregiao.mesorregiao.UF.sigla}`;
            const docRef = doc(citiesRef); 
            batch.set(docRef, { name: cityName });
        });

        await batch.commit();

        return { success: true, message: `${municipalities.length} municípios importados com sucesso!` };
    } catch (e: any) {
        console.error('Failed to import Brazilian cities:', e);
        return { success: false, error: e.message || 'Falha ao importar municípios.' };
    }
}


export async function getCityByCep(cep: string): Promise<{ success: boolean; data?: any; error?: string; }> {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) {
            throw new Error('Falha ao buscar o CEP. Verifique o número e tente novamente.');
        }
        const data = await response.json();
        return { success: true, data };
    } catch (e: any) {
        console.error('ViaCEP API error:', e);
        return { success: false, error: e.message || 'Ocorreu um erro ao consultar a API ViaCEP.' };
    }
}

// Helper to convert Firestore Timestamp to a formatted string
const formatTimestamp = (timestamp: any): string | null => {
  if (timestamp instanceof Timestamp) {
    return format(timestamp.toDate(), "dd/MM/yyyy HH:mm");
  }
  // Handle cases where it might already be a string or other type
  return null;
};

export async function getUsers(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const firestore = getFirestoreInstance();
    const usersCollection = collection(firestore, 'users');
    const snapshot = await getDocs(usersCollection);
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? formatTimestamp(data.createdAt) : 'N/A',
        lastLogin: data.lastLogin ? formatTimestamp(data.lastLogin) : 'N/A',
      };
    });
    return { success: true, data: users };
  } catch (e: any) {
    console.error('Failed to get users:', e);
    return { success: false, error: e.message || 'Falha ao buscar usuários.' };
  }
}

const updateUserSchema = z.object({
  userId: z.string(),
  displayName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
  role: z.enum(['admin', 'gestor_publico']),
  cityId: z.string().optional().nullable(),
});

export async function updateUser(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const parsed = updateUserSchema.safeParse({
    userId: formData.get('userId'),
    displayName: formData.get('displayName'),
    role: formData.get('role'),
    cityId: formData.get('cityId') || null,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    };
  }

  const { userId, displayName, role, cityId } = parsed.data;

  // Admin role cannot have cityId, gestor_publico must have cityId
  if (role === 'admin' && cityId) {
    return { success: false, error: "Administradores não podem ser associados a uma cidade."};
  }
  if (role === 'gestor_publico' && !cityId) {
    return { success: false, error: "Gestor Público deve ser associado a uma cidade."};
  }


  try {
    const firestore = getFirestoreInstance();
    const userRef = doc(firestore, 'users', userId);
    
    await updateDoc(userRef, {
        displayName: displayName,
        roles: [role],
        cityId: cityId
    });
    
    return { success: true };
  } catch (e: any) {
    console.error('Failed to update user:', e);
    return { success: false, error: e.message || 'Falha ao atualizar o usuário.' };
  }
}
