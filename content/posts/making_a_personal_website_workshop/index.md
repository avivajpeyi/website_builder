---
# Documentation: https://wowchemy.com/docs/managing-content/

title: "Making a personal website workshop"
subtitle: "With Github, Hugo, and wowchemy"
summary: "Notes to make a personal website using Github, Hugo, and wowchemy."
authors: []
tags: []
categories: []
date: 2023-04-27T21:54:48+12:00
lastmod: 2023-04-27T21:54:48+12:00
featured: false
draft: false

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# Focal points: Smart, Center, TopLeft, Top, TopRight, Left, Right, BottomLeft, Bottom, BottomRight.
image:
  caption: ""
  focal_point: ""
  preview_only: false

# Projects (optional).
#   Associate this post with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `projects = ["internal-project"]` references `content/project/deep-learning/index.md`.
#   Otherwise, set `projects = []`.
projects: []
---


{{< toc >}}

## Introduction
Today we will use [Hugo] and [wowchemy] to make a personal website (hosted on github). 

By the end of this workshop, you all should have a website but may need to spend more time customising it to your liking.

{{% callout note %}}
This will require some coding/usage of `git`. Here are some no coding/git alternatives:
- https://sites.google.com/ (no coding necessary)
- https://www.journoportfolio.com/
- https://jsonresume.org/
{{% /callout %}}


One can now use [netlify](https://wowchemy.com/docs/getting-started/hugo-cms/) and [Hugo]'s "CMS" (whatever that stands for) to make a website without using git. However, I have not tried this yet, so I can't help you with it. :sweat_smile:



## Setting up your website

### 0. Pre-requisites 


**_1. Get git_**

First, check if running `git status` in your terminal gives an error. If it does, you'll need to install git.
Here are instructions to install [git](https://github.com/git-guides/install-git).

**_2. Setup ssh keys_**

Next, you'll need to [setup ssh keys](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
so that you can push to github without having to enter your password every time.

Create an ssh key (I'd suggest not entering a passphrase)
```bash
ssh-keygen -t ed25519 -C "your_github_email@example.com"
cat ~/.ssh/id_ed25519.pub
```
Copy the output of the above command and paste it into the [ssh keys section of your github account](https://github.com/settings/keys) (https://github.com/settings/keys).

**_3. Install hugo_**

You'll need [Hugo] on your local machine.

- macOS
  ```bash
  brew install hugo
  ```
- Windows
  ```bash
  choco install hugo-extended
  ```

- Linux
  ```bash
  sudo snap install hugo
  ```


### 1. Make a github account 

Make sure to use a username that you are happy to have as part of your website url (e.g. https://avivajpeyi.github.io/).


### 2. Download a template website
There are lots of [template website]s to choose from. Here are some that I like:
   - The ['academic' template](https://github.com/wowchemy/starter-hugo-academic)
   - The [minimalist template](https://github.com/wowchemy/hugo-minimal-theme.git)

### 3. Setup website repo

Make a repo called `your_username.github.io` (e.g. `avivajpeyi.github.io`) and clone it to your computer (e.g. `git clone git@github.com:your_username/your_username.github.io.git`).



### 4. Copy the template contents

Copy the hugo template into your repo. Remember to also copy the `.gitignore` file and `.github` dir. __Do not copy the `.git` dir__.

```bash
cp -r starter-academic/* your_username.github.io/
cp -r starter-academic/.gitignore your_username.github.io/
cp -r starter-academic/.github your_username.github.io/
```




### 5. View your website locally

Run the following, and you should see your website at [http://localhost:1313] (or whatever port it says).
```bash
cd your_username.github.io
hugo server
```
If you get an error here, there must have been a problem with installing [Hugo]. :cry:

### 6. Personalise! 

Time to make your website your own! For now, lets just change the title of your website (we'll do more edits [later](#personalising-your-website)).

Change the default name in the following two files
```
./config/_default/config.yaml
./content/authors/admin/_index.md
```
Saving the files should automatically update [http://localhost:1313]. 


### 7. Add the github-workflow to build the pages 

We'd like github to automatically build and deploy our website whenever we push changes to the `main` branch. To do this, we need to add a github workflow.
Here is a workflow that you can use:

{{< gist avivajpeyi b363e8228526f9dedaf28e0399f0444a  >}}

Place [this file](https://shorturl.at/elsDI) in the `.github/workflows/deploy-pages.yml`.

### 8. Push your changes to github

Time to commit and push your changes to github. 

```bash
git add -A
git commit -m "init website"
git push origin main
```

Go to your repo on github and check that the files have been pushed. You should see a new `gh_pages` branch.


### 9. Enable github pages

You will also need to enable github pages. This is an optional setting in github repos telling github that you may want to host a website from this repo.

1. Go to https://github.com/your_username/your_username.github.io/settings/pages
2. Select `gh_pages` as the source branch

Your website should now be live at https://your_username.github.io/!

:tada: :tada: :tada:


### TLDR

Here is a small bash script that you may find helpful. Find-replace `your_username` with your github username and run the following commands in your terminal:
```bash
git clone https://github.com/wowchemy/starter-hugo-academic.git
git clone git@github.com:your_username/your_username.github.io.git
cp -r starter-hugo-academic/* your_username.github.io/
cp -r starter-hugo-academic/.github your_username.github.io/
cp -r starter-hugo-academic/.gitignore your_username.github.io/
rm -rf starter-hugo-academic
cd your_username.github.io
wget https://shorturl.at/elsDI -O .github/workflows/deploy-pages.yml
git add -A
git commit -m 'init website'
git push
```

{{% callout note %}}
Remember to 'activate' github pages in your repo settings (see [step 9](#9-enable-github-pages) above).
{{% /callout %}}





## Personalising your website

[Wowchemy] guide:
- https://wowchemy.com/docs/content/writing-markdown-latex/
- https://wowchemy.com/docs/getting-started/customization/

Open up the project in your favourite text editor (vim, pycharm, Rstudio, etc.)

Your directory structure should look something like this:
```bash
.
├── academic.Rproj
├── assets
│   └── jsconfig.json
├── config
│   └── _default
│       ├── config.yaml
│       ├── languages.yaml
│       ├── menus.yaml
│       └── params.yaml
├── content
│   ├── _index.md
│   ├── privacy.md
│   ├── terms.md
│   ├── admin
│   │   └── index.md
│   ├── authors
│   │   ├── admin
│   │   │   ├── avatar.png
│   │   │   └── _index.md
│   │   └── _index.md
...

```

- `content/_index.md` is the homepage (and where we will be making most of our edits today)
- `content/authors/admin/_index.md` is where your personal profile page lives
- `config/_default/config.yaml` is where you can change the title of your website, etc.


### Basic edits

Try to make the following edits to your website:
- Change the title of your website (`content/authors/admin/_index.md`)
- Change the avatar picture (`content/authors/admin/avatar.png`, or use [gravatar](https://en.gravatar.com/), `config/_default/params.yaml` )
- Change your website icon (`assets/media/icon.png`)
- Change the menu items (`config/_default/menus.yaml`)
- Add a link to your CV (`static/uploads/cv.pdf`)
- Edit your homepage (`content/_index.md`)

Remember to keep checking [http://localhost:1313] to see your changes, and commiting your work!

### Generating a publication list with a bib file

Given a bib file with your publications (e.g. `publications.bib`), you can autogenerate the publication list on your website using the `academic` python package:
```bash
pip3 install -U academic
cd your_username.github.io/
academic import --bibtex <path/to/publications.bib>
```
This will create a `publication` folder with a markdown file for each publication. You can then edit these files to add a summary, etc. See [here](https://wowchemy.com/docs/content/publications/) for more details.

### Adding blog post entries

```bash
cd your_username.github.io/
hugo new --kind post post/my-first-post
```
In place of `post`, you can also use `project`, or `event`. See [here](https://wowchemy.com/docs/content/) for more details.




[Hugo]:https://gohugo.io/
[Wowchemy]:https://wowchemy.com/
[template website]:https://wowchemy.com/templates/ 
[http://localhost:1313]: http://localhost:1313
