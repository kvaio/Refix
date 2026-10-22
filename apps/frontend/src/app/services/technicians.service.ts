import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TechnicianProfile {
  id: string;
  name: string;
  bio: string | null;
  profession: string | null;
  yearsExperience: number | null;
  certifications: string | null;
  rating: number;
  available: boolean;
}

export interface MyTechnicianProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile: {
    profession: string | null;
    yearsExperience: number | null;
    certifications: string | null;
    bio: string | null;
    rating: number;
    isAvailable: boolean;
    latitude: number | null;
    longitude: number | null;
  };
}

export interface TechnicianReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  serviceRequest: {
    title: string;
    client: { name: string };
  };
}

@Injectable({ providedIn: 'root' })
export class TechniciansService {
  private readonly apiUrl = environment.apiUrl + '/technicians';

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<TechnicianProfile[]> {
    return this.http.get<TechnicianProfile[]>(this.apiUrl);
  }

  getMyProfile(): Observable<MyTechnicianProfile> {
    return this.http.get<MyTechnicianProfile>(this.apiUrl + '/me');
  }

  updateMyProfile(data: {
    profession: string;
    yearsExperience: number;
    certifications: string | null;
    bio: string;
    isAvailable: boolean;
  }): Observable<MyTechnicianProfile> {
    return this.http.patch<MyTechnicianProfile>(this.apiUrl + '/me', data);
  }

  getMyReviews(): Observable<TechnicianReview[]> {
    return this.http.get<TechnicianReview[]>(this.apiUrl + '/me/reviews');
  }
}
