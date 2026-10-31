import SwiftUI

/// A horizontal carousel that keeps a sliver of the neighboring cards at the edges of the screen.
struct PeekCarousel<Item: Identifiable, Content: View>: View where Item.ID: Hashable {
  let items: [Item]
  @Binding var selection: Item.ID?
  let emptyTitle: String
  @ViewBuilder var content: (Item) -> Content

  var body: some View {
    if items.isEmpty {
      Text(emptyTitle)
        .font(.title3)
        .foregroundStyle(.secondary)
        .frame(maxWidth: .infinity, minHeight: 160)
        .background(Color.primary.opacity(0.06), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .padding(.horizontal, 16)
    } else {
      ScrollView(.horizontal, showsIndicators: false) {
        HStack(spacing: 12) {
          ForEach(items) { item in
            content(item)
              .containerRelativeFrame(.horizontal) { width, _ in max(0, width - 44) }
          }
        }
        .scrollTargetLayout()
        .padding(.horizontal, 16)
      }
      .scrollTargetBehavior(.viewAligned)
      .scrollPosition(id: $selection)
    }
  }
}
