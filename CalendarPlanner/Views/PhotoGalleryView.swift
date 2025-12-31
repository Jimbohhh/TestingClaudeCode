//
//  PhotoGalleryView.swift
//  CalendarPlanner
//
//  Photo gallery view with sharing capabilities
//

import SwiftUI
import PhotosUI

struct PhotoGalleryView: View {
    @EnvironmentObject var viewModel: PhotoViewModel
    @EnvironmentObject var idleTimerService: IdleTimerService
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var selectedPhoto: Photo?
    @State private var showingPhotoPicker = false

    let columns = [
        GridItem(.flexible()),
        GridItem(.flexible()),
        GridItem(.flexible())
    ]

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.photos.isEmpty {
                    VStack {
                        Image(systemName: "photo.on.rectangle")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        Text("No photos yet")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Text("Tap + to add photos")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 10) {
                            ForEach(viewModel.photos) { photo in
                                PhotoThumbnailView(photo: photo)
                                    .onTapGesture {
                                        selectedPhoto = photo
                                    }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Photos")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingPhotoPicker = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingPhotoPicker) {
                PhotoPickerView()
            }
            .sheet(item: $selectedPhoto) { photo in
                PhotoDetailView(photo: photo)
            }
            .onAppear {
                idleTimerService.recordActivity()
            }
        }
    }
}

struct PhotoThumbnailView: View {
    @EnvironmentObject var viewModel: PhotoViewModel
    let photo: Photo

    var body: some View {
        ZStack(alignment: .topTrailing) {
            if let uiImage = viewModel.loadImage(for: photo) {
                Image(uiImage: uiImage)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: 110, height: 110)
                    .clipped()
                    .cornerRadius(8)
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 110, height: 110)
                    .cornerRadius(8)
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    )
            }

            if photo.isFavorite {
                Image(systemName: "heart.fill")
                    .foregroundColor(.red)
                    .padding(6)
                    .background(Color.white.opacity(0.8))
                    .clipShape(Circle())
                    .padding(6)
            }
        }
    }
}

struct PhotoPickerView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var viewModel: PhotoViewModel
    @State private var selectedItems: [PhotosPickerItem] = []

    var body: some View {
        NavigationView {
            PhotosPicker(
                selection: $selectedItems,
                maxSelectionCount: 10,
                matching: .images
            ) {
                VStack(spacing: 20) {
                    Image(systemName: "photo.on.rectangle.angled")
                        .font(.system(size: 60))
                        .foregroundColor(.blue)

                    Text("Select Photos")
                        .font(.title2)

                    Text("Choose up to 10 photos")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .onChange(of: selectedItems) { oldValue, newValue in
                Task {
                    await loadPhotos(from: newValue)
                }
            }
            .navigationTitle("Add Photos")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func loadPhotos(from items: [PhotosPickerItem]) async {
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let uiImage = UIImage(data: data) {
                await MainActor.run {
                    viewModel.addPhoto(image: uiImage)
                }
            }
        }

        await MainActor.run {
            dismiss()
        }
    }
}

struct PhotoDetailView: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var viewModel: PhotoViewModel

    let photo: Photo

    @State private var caption: String = ""
    @State private var isEditingCaption = false
    @State private var showingDeleteAlert = false
    @State private var showingShareSheet = false

    var body: some View {
        NavigationView {
            VStack {
                if let uiImage = viewModel.loadImage(for: photo) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: .infinity)

                    VStack(alignment: .leading, spacing: 10) {
                        if isEditingCaption {
                            HStack {
                                TextField("Add a caption", text: $caption)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())

                                Button("Save") {
                                    viewModel.updatePhotoCaption(photo, caption: caption)
                                    isEditingCaption = false
                                }
                            }
                        } else {
                            HStack {
                                Text(caption.isEmpty ? "No caption" : caption)
                                    .foregroundColor(caption.isEmpty ? .secondary : .primary)

                                Spacer()

                                Button(action: { isEditingCaption = true }) {
                                    Image(systemName: "pencil")
                                }
                            }
                        }

                        HStack(spacing: 20) {
                            Button(action: {
                                viewModel.toggleFavorite(photo)
                            }) {
                                Image(systemName: photo.isFavorite ? "heart.fill" : "heart")
                                    .foregroundColor(photo.isFavorite ? .red : .gray)
                            }

                            Button(action: { showingShareSheet = true }) {
                                Image(systemName: "square.and.arrow.up")
                            }

                            Spacer()

                            Button(role: .destructive, action: { showingDeleteAlert = true }) {
                                Image(systemName: "trash")
                            }
                        }
                        .font(.title2)
                    }
                    .padding()

                    Spacer()
                }
            }
            .navigationTitle("Photo")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                caption = photo.caption
            }
            .alert("Delete Photo", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    viewModel.deletePhoto(photo)
                    dismiss()
                }
            } message: {
                Text("Are you sure you want to delete this photo?")
            }
            .sheet(isPresented: $showingShareSheet) {
                if let image = viewModel.loadImage(for: photo) {
                    ShareSheet(items: [image])
                }
            }
        }
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
