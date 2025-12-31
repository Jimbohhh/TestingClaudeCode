//
//  PhotoService.swift
//  CalendarPlanner
//
//  Service for photo storage and management
//

import Foundation
import UIKit

class PhotoService {
    private let fileManager = FileManager.default
    private var photosDirectory: URL {
        let documentsDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first!
        let photosDir = documentsDirectory.appendingPathComponent("Photos")

        if !fileManager.fileExists(atPath: photosDir.path) {
            try? fileManager.createDirectory(at: photosDir, withIntermediateDirectories: true)
        }

        return photosDir
    }

    // MARK: - Save Image

    func saveImage(_ image: UIImage, withName name: String) -> Bool {
        guard let data = image.jpegData(compressionQuality: 0.8) else {
            return false
        }

        let fileURL = photosDirectory.appendingPathComponent("\(name).jpg")

        do {
            try data.write(to: fileURL)
            return true
        } catch {
            print("Error saving image: \(error.localizedDescription)")
            return false
        }
    }

    // MARK: - Load Image

    func loadImage(named name: String) -> UIImage? {
        let fileURL = photosDirectory.appendingPathComponent("\(name).jpg")

        guard fileManager.fileExists(atPath: fileURL.path) else {
            return nil
        }

        return UIImage(contentsOfFile: fileURL.path)
    }

    // MARK: - Delete Image

    func deleteImage(named name: String) {
        let fileURL = photosDirectory.appendingPathComponent("\(name).jpg")

        try? fileManager.removeItem(at: fileURL)
    }

    // MARK: - List All Images

    func listAllImages() -> [String] {
        guard let files = try? fileManager.contentsOfDirectory(atPath: photosDirectory.path) else {
            return []
        }

        return files.filter { $0.hasSuffix(".jpg") }
            .map { String($0.dropLast(4)) }
    }
}
