(function () {
  "use strict";

  var WA_NUMBER = "6281234567890";
  var cart = new Map();

  var cartPanel = document.getElementById("cart");
  var backdrop = document.getElementById("backdrop");
  var cartOpenBtn = document.getElementById("cartOpen");
  var cartCloseBtn = document.getElementById("cartClose");
  var cartItemsEl = document.getElementById("cartItems");
  var cartEmptyEl = document.getElementById("cartEmpty");
  var cartCountEl = document.getElementById("cartCount");
  var cartTotalEl = document.getElementById("cartTotal");
  var checkoutEl = document.getElementById("checkout");
  var toastEl = document.getElementById("toast");
  var inertTargets = [
    document.querySelector(".site-header"),
    document.getElementById("main"),
    document.querySelector(".site-footer")
  ];

  var lastFocus = null;
  var toastTimer = null;
  var scrollbarPad = 0;

  var rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });

  function formatIDR(value) {
    return rupiah.format(value).replace(/\u00a0/g, " ");
  }

  function totalItems() {
    var n = 0;
    cart.forEach(function (entry) {
      n += entry.qty;
    });
    return n;
  }

  function subtotal() {
    var n = 0;
    cart.forEach(function (entry) {
      n += entry.qty * entry.price;
    });
    return n;
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2200);
  }

  function renderCart() {
    cartItemsEl.innerHTML = "";

    cart.forEach(function (entry, name) {
      var li = document.createElement("li");
      li.className = "cart-item";

      var head = document.createElement("div");
      head.className = "ci-head";

      var title = document.createElement("span");
      title.className = "ci-name";
      title.textContent = name;

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ci-remove";
      remove.dataset.action = "remove";
      remove.dataset.name = name;
      remove.setAttribute("aria-label", "Hapus " + name + " dari keranjang");
      remove.textContent = "\u00d7";

      head.appendChild(title);
      head.appendChild(remove);

      var qty = document.createElement("div");
      qty.className = "qty";
      qty.setAttribute("role", "group");
      qty.setAttribute("aria-label", "Jumlah " + name);

      var dec = document.createElement("button");
      dec.type = "button";
      dec.className = "qty-btn";
      dec.dataset.action = "dec";
      dec.dataset.name = name;
      dec.setAttribute("aria-label", "Kurangi " + name);
      dec.textContent = "\u2212";

      var num = document.createElement("span");
      num.className = "qty-num";
      num.textContent = entry.qty;

      var inc = document.createElement("button");
      inc.type = "button";
      inc.className = "qty-btn";
      inc.dataset.action = "inc";
      inc.dataset.name = name;
      inc.setAttribute("aria-label", "Tambah " + name);
      inc.textContent = "+";

      qty.appendChild(dec);
      qty.appendChild(num);
      qty.appendChild(inc);

      var line = document.createElement("span");
      line.className = "ci-total";
      line.textContent = formatIDR(entry.price * entry.qty);

      li.appendChild(head);
      li.appendChild(qty);
      li.appendChild(line);
      cartItemsEl.appendChild(li);
    });

    var count = totalItems();
    cartCountEl.textContent = count;
    cartEmptyEl.hidden = count > 0;

    cartTotalEl.textContent = formatIDR(subtotal());

    if (count === 0) {
      checkoutEl.classList.add("is-disabled");
      checkoutEl.setAttribute("aria-disabled", "true");
      checkoutEl.setAttribute("tabindex", "-1");
      checkoutEl.removeAttribute("href");
    } else {
      checkoutEl.classList.remove("is-disabled");
      checkoutEl.removeAttribute("aria-disabled");
      checkoutEl.removeAttribute("tabindex");
      checkoutEl.href = buildWhatsAppLink();
    }
  }

  function buildWhatsAppLink() {
    var lines = ["Halo RYOKU, saya mau pesan:"];
    cart.forEach(function (entry, name) {
      lines.push("- " + entry.qty + "\u00d7 " + name);
    });
    lines.push("");
    lines.push("Subtotal: " + formatIDR(subtotal()));
    lines.push("Ambil di kedai.");

    return (
      "https://wa.me/" +
      WA_NUMBER +
      "?text=" +
      encodeURIComponent(lines.join("\n"))
    );
  }

  function addToCart(name, price) {
    var entry = cart.get(name);
    if (entry) {
      entry.qty += 1;
    } else {
      cart.set(name, { price: price, qty: 1 });
    }
    renderCart();
    showToast(name + " ditambahkan");
  }

  function changeQty(name, delta) {
    var entry = cart.get(name);
    if (!entry) return;

    entry.qty += delta;
    if (entry.qty <= 0) {
      cart.delete(name);
    }
    renderCart();
  }

  function removeItem(name) {
    cart.delete(name);
    renderCart();
    showToast(name + " dihapus");
  }

  function focusableIn(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function openCart() {
    lastFocus = document.activeElement;
    scrollbarPad = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.paddingRight = scrollbarPad + "px";
    document.body.classList.add("cart-open");
    cartPanel.classList.add("is-open");
    backdrop.hidden = false;
    // Force a frame so the transition runs from the hidden state.
    requestAnimationFrame(function () {
      backdrop.classList.add("is-open");
    });
    cartPanel.setAttribute("aria-hidden", "false");
    cartOpenBtn.setAttribute("aria-expanded", "true");
    inertTargets.forEach(function (el) {
      if (el) el.inert = true;
    });
    window.setTimeout(function () {
      cartCloseBtn.focus();
    }, 40);
    document.addEventListener("keydown", onKeydown);
  }

  function closeCart() {
    document.body.classList.remove("cart-open");
    document.body.style.paddingRight = "";
    cartPanel.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    cartPanel.setAttribute("aria-hidden", "true");
    cartOpenBtn.setAttribute("aria-expanded", "false");
    inertTargets.forEach(function (el) {
      if (el) el.inert = false;
    });
    window.setTimeout(function () {
      if (!cartPanel.classList.contains("is-open")) {
        backdrop.hidden = true;
      }
    }, 420);
    document.removeEventListener("keydown", onKeydown);
    if (
      lastFocus &&
      typeof lastFocus.focus === "function" &&
      !cartPanel.contains(lastFocus)
    ) {
      lastFocus.focus();
    } else {
      cartOpenBtn.focus();
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeCart();
      return;
    }

    if (event.key !== "Tab") return;

    var focusable = focusableIn(cartPanel);
    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.querySelectorAll(".add").forEach(function (button) {
    button.addEventListener("click", function () {
      addToCart(button.dataset.name, Number(button.dataset.price));
    });
  });

  cartItemsEl.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;

    var name = button.dataset.name;
    var action = button.dataset.action;

    if (action === "inc") changeQty(name, 1);
    if (action === "dec") changeQty(name, -1);
    if (action === "remove") removeItem(name);
  });

  cartOpenBtn.addEventListener("click", openCart);
  cartCloseBtn.addEventListener("click", closeCart);
  backdrop.addEventListener("click", closeCart);

  checkoutEl.addEventListener("click", function (event) {
    if (cart.size === 0) {
      event.preventDefault();
    }
  });

  renderCart();
})();
