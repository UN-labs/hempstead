import React, { Component } from 'react'
import {connect} from 'react-redux';
import * as mainActions from '../actions/mainActions';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete'
import { Link } from 'react-router-dom'

import AnnotatedSection from '../components/AnnotatedSection'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faWrench from '@fortawesome/fontawesome-free-solid/faWrench'
import faStar from '@fortawesome/fontawesome-free-solid/faStar'
import faList from '@fortawesome/fontawesome-free-solid/faList'

import {
  Button,
  FormGroup,
  Label,
  Input,
} from 'reactstrap';

class CombineList extends Component {

  constructor(props) {
    super(props)
    this.state = {
      address: '',
      availableCertifications: [],
      selectedCertifications: {},
      customDataInputs: {},
      products: []
    }
    this.onChange = (address) => this.setState({ address })
  }

  componentDidMount(){
    this.props.passageInstance.getAllCertificationsIds()
      .then((result) => {
        result.map((certificationId) => {
          this.props.passageInstance.getCertificationById(String(certificationId).valueOf())
            .then((result) => {
              const certification = {
                name: result[0],
                imageUrl: result[1],
                id: certificationId,
              }
              this.setState({availableCertifications: [...this.state.availableCertifications, certification]})
            });
          return false;
        });
    })

    this.props.passageInstance.getOwnerProducts()
      .then((result) => {

        result.map((productId) => {
          this.props.passageInstance.getProductById(String(productId).valueOf(), "latest")
            .then((result) => {
              var _this = this;
              const product = {
                name: result[0],
                description: result[1],
                latitude: parseFloat(result[2]),
                longitude: parseFloat(result[3]),
                versionCreationDate: Date(result[4]),
                versions: result[5],
                id: productId,
              }
              this.setState({products: [...this.state.products, product]})
            })
            .catch((error) => {
              console.log(error);
            })
          return false;
        })
      });
  }

  handleChange = (e) => {
    const certificationId = e.target.name;
    this.setState({selectedCertifications: {...this.state.selectedCertifications, [certificationId]: e.target.checked}})
  }

  handleCreateNewProduct = () => {
    const selectedCertifications = this.state.selectedCertifications;
    const certificationsArray = [];
    Object.keys(selectedCertifications).map(key => {
      if(selectedCertifications[key] === true){
        certificationsArray.push(key)
      }
      return false;
    })

    var customDataObject = {}
    Object.keys(this.state.customDataInputs).map(inputKey => {
      customDataObject[this.state.customDataInputs[inputKey].key] = this.state.customDataInputs[inputKey].value;
      return false;
    })
    this.props.passageInstance.createProduct(this.props.name, this.props.description, this.props.latitude.toString(), this.props.longitude.toString(), certificationsArray, JSON.stringify(customDataObject), {from: this.props.web3Accounts[0], gas:1000000})
      .then((result) => {
        // product created! ... but we use an event watcher to show the success message, so nothing actuelly happens here after we create a product
      })
  }

  handleSelect = (address, placeId) => {
    this.setState({ address })

    geocodeByAddress(this.state.address)
      .then(results => getLatLng(results[0]))
      .then(latLng => {
        // TODO: disable the "update" button until a lat/long is returned from the Google Maps API
        return this.props.dispatch(mainActions.updateLatLng(latLng))
      })
      .catch(error => console.error('Error', error))
  }

  appendInput() {
    var newInputKey = `input-${Object.keys(this.state.customDataInputs).length}`; // this might not be a good idea (e.g. when removing then adding more inputs)
    this.setState({ customDataInputs: {...this.state.customDataInputs, [newInputKey]: {key: "", value: ""} }});
  }

  render() {
    const products = this.state.products.map((product, index) => {
      return (
        <div>
          <FormGroup>
              <Input type="checkbox" name="productSelection" onChange={(e) => {}}></Input>
          </FormGroup>
          <Link to={`/products/${product.id}`}>
            <div key={index}>
              <b>{product.name || "Produit sans nom"}</b> &mdash; {product.description || "Aucune description"}
              <hr/>
            </div>
          </Link>
        </div>
      )
    })

    const inputProps = {
      value: this.state.address,
      onChange: this.onChange,
      placeholder: "Emplacement (adresse, latitude & longitude, entreprise)"
    }

    return (
      <div>
        {/* Section de sélection des produits */}
        <AnnotatedSection
          annotationContent={
            <div>
              <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faList}/>
              Sélection des produits
            </div>
          }
          panelContent={
            <div>
              {products && products.length > 0 ? products : 
              <div>
                Vous n'avez créé aucun produit.
                <Link style={{marginLeft: "10px"}} to="/create">Ajouter un produit</Link>
              </div>}
            </div>
          }
        />

        {/* Section des informations du produit combiné */}       
        <AnnotatedSection
          annotationContent={
            <div>
              <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faStar}/>
              Informations du produit combiné
            </div>
          }
          panelContent={
            <div>
              <FormGroup>
                  <Label>Nom</Label>
                  <Input placeholder="Nom du produit" value={this.props.name} onChange={(e) => {this.props.dispatch(mainActions.updateName(e.target.value))}}></Input>
              </FormGroup>
              <FormGroup>
                  <Label>Description</Label>
                  <Input placeholder="Description sommaire du produit" value={this.props.description} onChange={(e) => {this.props.dispatch(mainActions.updateDescription(e.target.value))}}></Input>
              </FormGroup>
              <FormGroup>
                  <Label>Emplacement actuel</Label>
                  <PlacesAutocomplete
                    inputProps={inputProps}
                    onSelect={this.handleSelect}
                    classNames={{input: "form-control"}}
                  />
              </FormGroup>
              <FormGroup>
                <Label>
                  Certification(s)
                  <Link style={{marginLeft: "10px"}} to="/createcertification">Créer +</Link>
                </Label>
                <div>
                  {this.state.availableCertifications && this.state.availableCertifications.length > 0 ?
                    this.state.availableCertifications.map((certification, index) => 
                      <div key={index}>
                        <input style={{marginRight: "5px"}} onChange={this.handleChange} name={certification.id} type="checkbox"></input>
                        <span>{certification.name}</span>
                      </div>
                    )
                    :
                    <div style={{marginLeft:"15px"}}>
                      Aucune certification existante.
                      <Link style={{marginLeft: "10px"}} to="/createcertification">Créer une certification</Link>
                    </div>
                  }
                </div>
              </FormGroup>
            </div>
          }
        />

        {/* Section des actions */}
        <AnnotatedSection
          annotationContent={
            <div>
              <FontAwesomeIcon fixedWidth style={{paddingTop:"3px", marginRight:"6px"}} icon={faWrench}/>
              Actions
            </div>
          }
          panelContent={
            <div>
              <Button color="primary" onClick={this.handleCreateNewProduct}>Effectuer la combinaison</Button>
            </div>
          }
        />
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    passageInstance: state.temporaryGodReducer.passageInstance,
    products: state.temporaryGodReducer.products,
    web3Accounts: state.temporaryGodReducer.web3Accounts,
    name: state.temporaryGodReducer.name,
    description: state.temporaryGodReducer.description,
    latitude: state.temporaryGodReducer.latitude,
    longitude: state.temporaryGodReducer.longitude,
    alert: state.temporaryGodReducer.alert,
  };
}

export default connect(mapStateToProps)(CombineList);