// Importation des modules et des constantes nécessaires
import { formatDate } from '../app/format.js'
import DashboardFormUI from '../views/DashboardFormUI.js'
import BigBilledIcon from '../assets/svg/big_billed.js'
import { ROUTES_PATH } from '../constants/routes.js'
import USERS_TEST from '../constants/usersTest.js'
import Logout from "./Logout.js"

// Fonction pour filtrer les factures en fonction du statut donné
export const filteredBills = (data, status) => {
  return (data && data.length) ?
    data.filter(bill => {
      let selectCondition

      // in jest environment
      if (typeof jest !== 'undefined') {
        selectCondition = (bill.status === status)
      }
      /* istanbul ignore next */
      else {
        // in prod environment
        const userEmail = JSON.parse(localStorage.getItem("user")).email
        selectCondition =
          (bill.status === status) &&
          ![...USERS_TEST, userEmail].includes(bill.email)
      }

      return selectCondition
    }) : []
}

// Fonction pour créer une carte HTML avec les informations de la facture
export const card = (bill) => {
  const firstAndLastNames = bill.email.split('@')[0]
  const firstName = firstAndLastNames.includes('.') ?
    firstAndLastNames.split('.')[0] : ''
  const lastName = firstAndLastNames.includes('.') ?
  firstAndLastNames.split('.')[1] : firstAndLastNames

  return (`
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `)
}

// Fonction pour créer des cartes HTML pour chaque facture dans le tableau de factures
export const cards = (bills) => {
  return bills && bills.length ? bills.map(bill => card(bill)).join("") : ""
}

// Fonction pour obtenir le statut en fonction de l'index
export const getStatus = (index) => {
  switch (index) {
    case 1:
      return "pending"
    case 2:
      return "accepted"
    case 3:
      return "refused"
  }
}

// Classe principale pour gérer les événements et l'interaction avec le DOM
export default class {
  constructor({ document, onNavigate, store, bills, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    // Gestion des événements de clic pour les flèches
    $('#arrow-icon1').click((e) => this.handleShowTickets(e, bills, 1))
    $('#arrow-icon2').click((e) => this.handleShowTickets(e, bills, 2))
    $('#arrow-icon3').click((e) => this.handleShowTickets(e, bills, 3))
    // Initialisation du module de déconnexion
    new Logout({ localStorage, onNavigate })
  }

  // Méthode pour gérer l'affichage de l'image de la facture dans une modale
  handleClickIconEye = () => {
    const billUrl = $('#icon-eye-d').attr("data-bill-url")
    const imgWidth = Math.floor($('#modaleFileAdmin1').width() * 0.8)
    $('#modaleFileAdmin1').find(".modal-body").html(`<div style='text-align: center;'><img width=${imgWidth} src=${billUrl} alt="Bill"/></div>`)
    if (typeof $('#modaleFileAdmin1').modal === 'function') $('#modaleFileAdmin1').modal('show')
  }

  // Méthode pour gérer l'événement de clic sur une facture et afficher le formulaire de modification
  handleEditTicket(e, bill, bills) {
    if (this.counter === undefined || this.id !== bill.id) this.counter = 0
    if (this.id === undefined || this.id !== bill.id) this.id = bill.id
    if (this.counter % 2 === 0) {
      bills.forEach(b => {
        $(`#open-bill${b.id}`).css({ background: '#0D5AE5' })
      })
      $(`#open-bill${bill.id}`).css({ background: '#2A2B35' })
      $('.dashboard-right-container div').html(DashboardFormUI(bill))
      $('.vertical-navbar').css({ height: '150vh' })
      this.counter ++
    } else {
      $(`#open-bill${bill.id}`).css({ background: '#0D5AE5' })

      $('.dashboard-right-container div').html(`
        <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `)
      $('.vertical-navbar').css({ height: '120vh' })
      this.counter ++
    }
    $('#icon-eye-d').click(this.handleClickIconEye)
    $('#btn-accept-bill').click((e) => this.handleAcceptSubmit(e, bill))
    $('#btn-refuse-bill').click((e) => this.handleRefuseSubmit(e, bill))
  }

  // Méthode pour gérer la soumission du formulaire d'acceptation d'une facture
  handleAcceptSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'accepted',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  // Méthode pour gérer la soumission du formulaire de refus d'une facture
  handleRefuseSubmit = (e, bill) => {
    const newBill = {
      ...bill,
      status: 'refused',
      commentAdmin: $('#commentary2').val()
    }
    this.updateBill(newBill)
    this.onNavigate(ROUTES_PATH['Dashboard'])
  }

  // Méthode pour afficher les factures en fonction de leur statut
  // handleShowTickets(e, bills, index) {
  //   if (this.counter === undefined || this.index !== index) this.counter = 0
  //   if (this.index === undefined || this.index !== index) this.index = index
  //   if (this.counter % 2 === 0) {
  //     $(`#arrow-icon${this.index}`).css({ transform: 'rotate(0deg)'})
  //     $(`#status-bills-container${this.index}`)
  //       .html(cards(filteredBills(bills, getStatus(this.index))))
  //     this.counter ++
  //   } else {
  //     $(`#arrow-icon${this.index}`).css({ transform: 'rotate(90deg)'})
  //     $(`#status-bills-container${this.index}`)
  //       .html("")
  //     this.counter ++
  //   }

  //   bills.forEach(bill => {
  //     $(`#open-bill${bill.id}`).click((e) => this.handleEditTicket(e, bill, bills))
  //   })

  //   return bills
  // }

  handleShowTickets(e, bills, index) {
    if (!this.expandedLists) this.expandedLists = {}
  
    if (!this.expandedLists[index]) {
      $(`#arrow-icon${index}`).css({ transform: 'rotate(0deg)' })
      $(`#status-bills-container${index}`)
        .html(cards(filteredBills(bills, getStatus(index))))
      this.expandedLists[index] = true
    } else {
      $(`#arrow-icon${index}`).css({ transform: 'rotate(90deg)' })
      $(`#status-bills-container${index}`)
        .html("")
      this.expandedLists[index] = false
    }
  
    bills.forEach(bill => {
      $(`#open-bill${bill.id}`).off('click')
      $(`#open-bill${bill.id}`).on('click', (e) => this.handleEditTicket(e, bill, bills))
    })
  
    return bills
  }

  // Méthode pour récupérer toutes les factures de tous les utilisateurs à partir du store
  getBillsAllUsers = () => {
    if (this.store) {
      return this.store
      .bills()
      .list()
      .then(snapshot => {
        const bills = snapshot
        .map(doc => ({
          id: doc.id,
          ...doc,
          date: doc.date,
          status: doc.status
        }))
        return bills
      })
      .catch(error => {
        throw error;
      })
    }
  }

  // not need to cover this function by tests
  /* istanbul ignore next */
   // Méthode pour mettre à jour une facture dans le store avec les nouvelles informations
  updateBill = (bill) => {
    if (this.store) {
    return this.store
      .bills()
      .update({data: JSON.stringify(bill), selector: bill.id})
      .then(bill => bill)
      .catch(console.log)
    }
  }
}
