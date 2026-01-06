---
# Documentation: https://sourcethemes.com/academic/docs/managing-content/

title: "Python Big-O Examples"
subtitle: ""
summary: "Exaples of Big-O code snippets"
authors: []
tags: []
categories: []
date: 2020-06-19T00:20:45+10:00
lastmod: 2020-06-19T00:20:45+10:00
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
# What are the Big-O for the following?
Some students in an Algorithms class I am teaching are having trouble with 
Big-O notation. Here are some practice problems:

## Qs 1
```python
for i in range(n):
       sum++
```
<div class="container">
  <a href="#qs1" class="btn btn-info" data-toggle="collapse">Answer</a>
  <div id="qs1" class="collapse">
    O(n)
  </div>
</div>


## Qs 2
```python
for i in range(n)
     for j in range(n) 
            sum+=1 
```
<div class="container">
  <a href="#qs2" class="btn btn-info" data-toggle="collapse">Answer</a>
  <div id="qs2" class="collapse">
    O(n)
  </div>
</div>


## Qs 3
```python
for i in range(n, - 1, -1):
	sum +=1
```
<div class="container">
  <a href="#qs3" class="btn btn-info" data-toggle="collapse">Answer</a>
  <div id="qs3" class="collapse">
    O(n^2)
  </div>
</div>


## Qs 4

```python
i = 1
while i<n:
    i *= 2
```
<div class="container">
  <a href="#qs4" class="btn btn-info" data-toggle="collapse">Answer</a>
  <div id="qs4" class="collapse">
    O(2^n)
  </div>
</div>


## Qs 5
```python
i = n
while (i < n)
     i ++    
```
<div class="container">
  <a href="#qs5" class="btn btn-info" data-toggle="collapse">Answer</a>
  <div id="qs5" class="collapse">
    O(1)
  </div>
</div>

## Qs 6
```python
def fibonacci(n):
	if (n <= 1): return n
	else: return(fibonacci(n - 2) + fibonacci(n -1))
```
<div class="container">
  <a href="#qs6" class="btn btn-info" data-toggle="collapse">Answer</a>
  <div id="qs6" class="collapse">
    O(2^n)
  </div>
</div>


## Qs 7
```python
i = 0 
while (i > n)
     i *= 2  
```
<div class="container">
  <a href="#qs7" class="btn btn-info" data-toggle="collapse">Answer</a>
  <div id="qs7" class="collapse">
    O(1)
  </div>
</div>


## Qs 8

```python
for(int i=n; i>0; i/=2)
   for(int j=0; j<i; j++)
      count++;
```
<div class="container">
  <a href="#qs8" class="btn btn-info" data-toggle="collapse">Answer</a>
  <div id="qs8" class="collapse">
    O(n)
  </div>
</div>


## Qs 9
```python
for(int i=1; i<n*n; i++)
    for(int j=1; j≤i; j++)
 	for(int k=1; k≤ 6; k++)
 	   sum ++;
```
<div class="container">
  <a href="#qs9" class="btn btn-info" data-toggle="collapse">Answer</a>
  <div id="qs9" class="collapse">
    O(n^4)
  </div>
</div>
