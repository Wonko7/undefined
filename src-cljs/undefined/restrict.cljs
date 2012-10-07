(ns undef.restrict
  (:use [undef.pages :only [add-pre-link-init!]])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em])           
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef]
            [goog.style :as style]))

(defn restrict-webkit-only [click-event & args]
  (when (not goog.userAgent.WEBKIT)
    (.preventDefault click-event)
    (js/alert "This project only works with Webkit browsers: Chrome, Safari, Android & Iphone browsers.")))

(add-pre-link-init! "restrict-webkit-only" restrict-webkit-only)
