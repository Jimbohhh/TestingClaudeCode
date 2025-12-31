//
//  PhotoSlideshowView.swift
//  CalendarPlanner
//
//  Photo slideshow view for idle mode
//

import SwiftUI

struct PhotoSlideshowView: View {
    @EnvironmentObject var viewModel: PhotoViewModel
    @EnvironmentObject var idleTimerService: IdleTimerService
    @State private var timer: Timer?
    @State private var opacity: Double = 1.0

    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()

            if viewModel.photos.isEmpty {
                VStack(spacing: 20) {
                    Image(systemName: "photo.on.rectangle")
                        .font(.system(size: 80))
                        .foregroundColor(.white.opacity(0.6))

                    Text("No photos to display")
                        .font(.title)
                        .foregroundColor(.white.opacity(0.8))

                    Text("Add photos to see them in slideshow mode")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.6))

                    Button("Exit Slideshow") {
                        idleTimerService.recordActivity()
                    }
                    .padding()
                    .background(Color.white.opacity(0.2))
                    .cornerRadius(10)
                    .foregroundColor(.white)
                }
            } else if let currentPhoto = viewModel.getCurrentPhoto(),
                      let image = viewModel.loadImage(for: currentPhoto) {
                VStack {
                    Spacer()

                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .opacity(opacity)
                        .animation(.easeInOut(duration: 1.0), value: opacity)

                    if !currentPhoto.caption.isEmpty {
                        Text(currentPhoto.caption)
                            .font(.title3)
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.black.opacity(0.6))
                            .cornerRadius(10)
                            .padding()
                    }

                    Spacer()

                    // Slideshow controls
                    HStack(spacing: 40) {
                        Button(action: previousPhoto) {
                            Image(systemName: "chevron.left.circle.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.white.opacity(0.8))
                        }

                        Button("Exit Slideshow") {
                            idleTimerService.recordActivity()
                        }
                        .padding()
                        .background(Color.white.opacity(0.2))
                        .cornerRadius(10)
                        .foregroundColor(.white)

                        Button(action: nextPhoto) {
                            Image(systemName: "chevron.right.circle.fill")
                                .font(.system(size: 40))
                                .foregroundColor(.white.opacity(0.8))
                        }
                    }
                    .padding(.bottom, 40)
                }
            }
        }
        .onAppear {
            startSlideshow()
        }
        .onDisappear {
            stopSlideshow()
        }
        .onTapGesture {
            idleTimerService.recordActivity()
        }
    }

    private func startSlideshow() {
        timer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
            withAnimation {
                opacity = 0
            }

            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                viewModel.nextPhoto()
                withAnimation {
                    opacity = 1.0
                }
            }
        }
    }

    private func stopSlideshow() {
        timer?.invalidate()
        timer = nil
    }

    private func nextPhoto() {
        withAnimation {
            opacity = 0
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            viewModel.nextPhoto()
            withAnimation {
                opacity = 1.0
            }
        }
    }

    private func previousPhoto() {
        withAnimation {
            opacity = 0
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            viewModel.previousPhoto()
            withAnimation {
                opacity = 1.0
            }
        }
    }
}
