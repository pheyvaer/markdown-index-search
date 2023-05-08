# Markdown index and search

This repository contains a service to generate a search index for Markdown resources and
a Web app to search for these resources based on a given term.

Imagine that you have a Solid pod with more than 100 Markdown files and
you want to find all Markdown files that mention the word "office".
The service iterates over all Markdown resources in a container.
It generates the search index and stores in the pod.
The service needs to run every time the contents of the Markdown files change.
The Web app loads this index and 
allows users to find the relevant Markdown resources by searching for "office".

## Service

You find the service in the folder `service`.

## Web app

You find the Web app in the folder `web-app`.

## License

This code is copyrighted by [Ghent University – imec](http://idlab.ugent.be/) and
released under the [MIT license](http://opensource.org/licenses/MIT).
