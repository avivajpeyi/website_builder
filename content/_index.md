---
# Leave the homepage title empty to use the site title
title: ''
summary: ''
date: 2022-10-24
type: landing

design:
  # Default section spacing
  spacing: '6rem'

sections:
  - block: resume-biography-3
    content:
      # Choose a user profile to display (a folder name within `content/authors/`)
      username: me
      text: ''
      # Show a call-to-action button under your biography? (optional)
      button:
        text: Download CV
        url: uploads/resume.pdf
      headings:
        about: ''
        education: ''
        interests: ''
    design:
      # Use the new Gradient Mesh which automatically adapts to the selected theme colors
      background:
        gradient_mesh:
          enable: true

      # Name heading sizing to accommodate long or short names
      name:
        size: md # Options: xs, sm, md, lg (default), xl

      # Avatar customization
      avatar:
        size: medium # Options: small (150px), medium (200px, default), large (320px), xl (400px), xxl (500px)
        shape: circle # Options: circle (default), square, rounded
  - block: collection
    id: selected-publications
    content:
      title: Selected Publications
      text: 
      filters:
        folders:
          - publication
    design:
      view: citation
      columns: 2
  - block: collection
    id: games
    content:
      title: Games & Experiments
      text: >-
        I prototype experimental games in Godot and Unity, primarily through game jams.
      filters:
        folders:
          - games
      count: 18
    design:
      view: "card"
      fill_image: true
      columns: 3
  - block: markdown
    id: contact
    content:
      title: Contact
      text: |-
        **Email:** [avi.vajpeyi@auckland.ac.nz](mailto:avi.vajpeyi@auckland.ac.nz)  
        **Phone:** +64 22 543 1418  
        **Office:** Building 303, Room 305, University of Auckland, New Zealand  
        **Hours:** Weekdays 08:30-16:30 NZT  

        [GitHub](https://github.com/avivajpeyi) · [LIGO GitLab](https://git.ligo.org/avi.vajpeyi) · [Itch.io](https://avivajpeyi.itch.io/)
---
