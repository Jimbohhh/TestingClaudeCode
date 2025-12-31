//
//  Photo.swift
//  CalendarPlanner
//
//  Model for photos
//

import Foundation
import UIKit

struct Photo: Identifiable, Codable {
    var id: UUID
    var imageName: String
    var caption: String
    var dateAdded: Date
    var isFavorite: Bool

    init(
        id: UUID = UUID(),
        imageName: String,
        caption: String = "",
        dateAdded: Date = Date(),
        isFavorite: Bool = false
    ) {
        self.id = id
        self.imageName = imageName
        self.caption = caption
        self.dateAdded = dateAdded
        self.isFavorite = isFavorite
    }
}
