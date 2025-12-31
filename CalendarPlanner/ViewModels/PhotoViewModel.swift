//
//  PhotoViewModel.swift
//  CalendarPlanner
//
//  ViewModel for photo management
//

import Foundation
import UIKit
import SwiftUI

@MainActor
class PhotoViewModel: ObservableObject {
    @Published var photos: [Photo] = []
    @Published var currentSlideshowIndex: Int = 0

    private let photoService = PhotoService()

    init() {
        loadPhotos()
    }

    func loadPhotos() {
        if let data = UserDefaults.standard.data(forKey: "photos"),
           let decoded = try? JSONDecoder().decode([Photo].self, from: data) {
            photos = decoded
        }
    }

    func savePhotos() {
        if let encoded = try? JSONEncoder().encode(photos) {
            UserDefaults.standard.set(encoded, forKey: "photos")
        }
    }

    func addPhoto(image: UIImage, caption: String = "") {
        let imageName = UUID().uuidString
        if photoService.saveImage(image, withName: imageName) {
            let photo = Photo(imageName: imageName, caption: caption)
            photos.append(photo)
            savePhotos()
        }
    }

    func deletePhoto(_ photo: Photo) {
        photoService.deleteImage(named: photo.imageName)
        photos.removeAll { $0.id == photo.id }
        savePhotos()
    }

    func updatePhotoCaption(_ photo: Photo, caption: String) {
        if let index = photos.firstIndex(where: { $0.id == photo.id }) {
            var updatedPhoto = photo
            updatedPhoto.caption = caption
            photos[index] = updatedPhoto
            savePhotos()
        }
    }

    func toggleFavorite(_ photo: Photo) {
        if let index = photos.firstIndex(where: { $0.id == photo.id }) {
            var updatedPhoto = photo
            updatedPhoto.isFavorite.toggle()
            photos[index] = updatedPhoto
            savePhotos()
        }
    }

    func loadImage(for photo: Photo) -> UIImage? {
        return photoService.loadImage(named: photo.imageName)
    }

    // MARK: - Slideshow

    func nextPhoto() {
        guard !photos.isEmpty else { return }
        currentSlideshowIndex = (currentSlideshowIndex + 1) % photos.count
    }

    func previousPhoto() {
        guard !photos.isEmpty else { return }
        currentSlideshowIndex = currentSlideshowIndex > 0 ? currentSlideshowIndex - 1 : photos.count - 1
    }

    func getCurrentPhoto() -> Photo? {
        guard !photos.isEmpty, currentSlideshowIndex < photos.count else { return nil }
        return photos[currentSlideshowIndex]
    }
}
