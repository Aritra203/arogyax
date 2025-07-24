import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'

const InventoryManagement = () => {
    const { aToken, backendUrl } = useContext(AdminContext)
    const [items, setItems] = useState([])
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [showAlerts, setShowAlerts] = useState(false)
    const [lowStockAlerts, setLowStockAlerts] = useState([])
    const [expiryAlerts, setExpiryAlerts] = useState({ expiringItems: [], expiredItems: [] })
    const [filterCategory, setFilterCategory] = useState('All')
    const [filterStatus, setFilterStatus] = useState('All')
    
    const [formData, setFormData] = useState({
        itemName: '',
        category: 'Medicines',
        description: '',
        manufacturer: '',
        batchNumber: '',
        expiryDate: '',
        unitPrice: '',
        quantity: '',
        reorderLevel: '',
        maxStockLevel: '',
        unit: 'Pieces',
        supplier: { name: '', contact: '', email: '' },
        location: { section: '', shelf: '', row: '' }
    })

    const categories = ['Medicines', 'Medical Equipment', 'Surgical Instruments', 'Consumables', 'Others']
    const units = ['Pieces', 'Bottles', 'Boxes', 'Vials', 'Tablets', 'Capsules', 'ML', 'Grams', 'KG']
    const statuses = ['All', 'In Stock', 'Low Stock', 'Out of Stock', 'Expired', 'Discontinued']

    const fetchItems = async () => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/inventory-list?category=${filterCategory}&status=${filterStatus}`, {
                headers: { 'aToken': aToken }
            })
            const data = await response.json()
            if (data.success) {
                setItems(data.items)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to fetch inventory items')
        }
    }

    const fetchAlerts = async () => {
        try {
            const [lowStockResponse, expiryResponse] = await Promise.all([
                fetch(`${backendUrl}/api/admin/inventory-low-stock`, { headers: { 'aToken': aToken } }),
                fetch(`${backendUrl}/api/admin/inventory-expiry`, { headers: { 'aToken': aToken } })
            ])

            const lowStockData = await lowStockResponse.json()
            const expiryData = await expiryResponse.json()

            if (lowStockData.success) {
                setLowStockAlerts(lowStockData.alerts)
            }
            if (expiryData.success) {
                setExpiryAlerts(expiryData)
            }
        } catch (error) {
            toast.error('Failed to fetch alerts')
        }
    }

    useEffect(() => {
        if (aToken) {
            fetchItems()
            fetchAlerts()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aToken, filterCategory, filterStatus])

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        const submitData = { ...formData }
        submitData.supplier = JSON.stringify(submitData.supplier)
        submitData.location = JSON.stringify(submitData.location)

        try {
            const url = editingItem
                ? `${backendUrl}/api/admin/inventory-update/${editingItem._id}`
                : `${backendUrl}/api/admin/inventory-add`
                
            const method = editingItem ? 'PUT' : 'POST'
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify(submitData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                setShowAddForm(false)
                setEditingItem(null)
                resetForm()
                fetchItems()
                fetchAlerts()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to save inventory item')
        }
    }

    const deleteItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return

        try {
            const response = await fetch(`${backendUrl}/api/admin/inventory-delete/${itemId}`, {
                method: 'DELETE',
                headers: { 'aToken': aToken }
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                fetchItems()
                fetchAlerts()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to delete item')
        }
    }

    const recordUsage = async (itemId, usage) => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/inventory-usage/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify(usage)
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                fetchItems()
                fetchAlerts()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to record usage')
        }
    }

    const restockItem = async (itemId, restockData) => {
        try {
            const response = await fetch(`${backendUrl}/api/admin/inventory-restock/${itemId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    aToken
                },
                body: JSON.stringify(restockData)
            })
            
            const data = await response.json()
            
            if (data.success) {
                toast.success(data.message)
                fetchItems()
                fetchAlerts()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error('Failed to restock item')
        }
    }

    const editItem = (item) => {
        setEditingItem(item)
        setFormData({
            itemName: item.itemName,
            category: item.category,
            description: item.description || '',
            manufacturer: item.manufacturer || '',
            batchNumber: item.batchNumber || '',
            expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            reorderLevel: item.reorderLevel,
            maxStockLevel: item.maxStockLevel,
            unit: item.unit,
            supplier: item.supplier || { name: '', contact: '', email: '' },
            location: item.location || { section: '', shelf: '', row: '' }
        })
        setShowAddForm(true)
    }

    const resetForm = () => {
        setFormData({
            itemName: '',
            category: 'Medicines',
            description: '',
            manufacturer: '',
            batchNumber: '',
            expiryDate: '',
            unitPrice: '',
            quantity: '',
            reorderLevel: '',
            maxStockLevel: '',
            unit: 'Pieces',
            supplier: { name: '', contact: '', email: '' },
            location: { section: '', shelf: '', row: '' }
        })
    }

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleNestedInputChange = (parent, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }))
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'In Stock': return 'text-green-500'
            case 'Low Stock': return 'text-yellow-500'
            case 'Out of Stock': return 'text-red-500'
            case 'Expired': return 'text-red-600'
            default: return 'text-gray-500'
        }
    }

    return (
        <div className='w-full max-w-6xl m-5'>
            <div className='flex justify-between items-center mb-3'>
                <p className='text-lg font-medium'>Inventory Management</p>
                <div className='flex gap-2'>
                    <button
                        onClick={() => setShowAlerts(!showAlerts)}
                        className='bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600'
                    >
                        Alerts ({lowStockAlerts.length + expiryAlerts.expiringItems.length + expiryAlerts.expiredItems.length})
                    </button>
                    <button
                        onClick={() => {
                            setShowAddForm(true)
                            setEditingItem(null)
                            resetForm()
                        }}
                        className='bg-primary text-white px-4 py-2 rounded hover:bg-blue-600'
                    >
                        Add New Item
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className='flex gap-4 mb-4'>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className='border rounded px-3 py-2'
                >
                    <option value='All'>All Categories</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className='border rounded px-3 py-2'
                >
                    {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>

            {/* Alerts Panel */}
            {showAlerts && (
                <div className='bg-yellow-50 border border-yellow-200 rounded p-4 mb-4'>
                    <h3 className='text-lg font-medium mb-2'>Inventory Alerts</h3>
                    
                    {lowStockAlerts.length > 0 && (
                        <div className='mb-3'>
                            <h4 className='font-medium text-red-600 mb-2'>Low Stock Items</h4>
                            {lowStockAlerts.map(item => (
                                <div key={item._id} className='bg-white p-2 rounded mb-1'>
                                    <span className='font-medium'>{item.itemName}</span> - 
                                    Current: {item.quantity}, Reorder Level: {item.reorderLevel}
                                </div>
                            ))}
                        </div>
                    )}

                    {expiryAlerts.expiringItems.length > 0 && (
                        <div className='mb-3'>
                            <h4 className='font-medium text-orange-600 mb-2'>Items Expiring Soon</h4>
                            {expiryAlerts.expiringItems.map(item => (
                                <div key={item._id} className='bg-white p-2 rounded mb-1'>
                                    <span className='font-medium'>{item.itemName}</span> - 
                                    Expires: {new Date(item.expiryDate).toDateString()}
                                </div>
                            ))}
                        </div>
                    )}

                    {expiryAlerts.expiredItems.length > 0 && (
                        <div>
                            <h4 className='font-medium text-red-600 mb-2'>Expired Items</h4>
                            {expiryAlerts.expiredItems.map(item => (
                                <div key={item._id} className='bg-white p-2 rounded mb-1'>
                                    <span className='font-medium'>{item.itemName}</span> - 
                                    Expired: {new Date(item.expiryDate).toDateString()}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
                    <div className='bg-white p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-bold'>
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddForm(false)
                                    setEditingItem(null)
                                    resetForm()
                                }}
                                className='text-gray-500 hover:text-gray-700'
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className='space-y-4'>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium mb-1'>Item Name *</label>
                                    <input
                                        type='text'
                                        value={formData.itemName}
                                        onChange={(e) => handleInputChange('itemName', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => handleInputChange('category', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className='col-span-2'>
                                    <label className='block text-sm font-medium mb-1'>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        rows='2'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Manufacturer</label>
                                    <input
                                        type='text'
                                        value={formData.manufacturer}
                                        onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Batch Number</label>
                                    <input
                                        type='text'
                                        value={formData.batchNumber}
                                        onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Expiry Date</label>
                                    <input
                                        type='date'
                                        value={formData.expiryDate}
                                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Unit Price *</label>
                                    <input
                                        type='number'
                                        step='0.01'
                                        value={formData.unitPrice}
                                        onChange={(e) => handleInputChange('unitPrice', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Quantity *</label>
                                    <input
                                        type='number'
                                        value={formData.quantity}
                                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Reorder Level *</label>
                                    <input
                                        type='number'
                                        value={formData.reorderLevel}
                                        onChange={(e) => handleInputChange('reorderLevel', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Max Stock Level *</label>
                                    <input
                                        type='number'
                                        value={formData.maxStockLevel}
                                        onChange={(e) => handleInputChange('maxStockLevel', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    />
                                </div>

                                <div>
                                    <label className='block text-sm font-medium mb-1'>Unit *</label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => handleInputChange('unit', e.target.value)}
                                        className='w-full border rounded px-3 py-2'
                                        required
                                    >
                                        {units.map(unit => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Supplier Information */}
                            <div className='border-t pt-4'>
                                <h3 className='text-lg font-medium mb-2'>Supplier Information</h3>
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Supplier Name *</label>
                                        <input
                                            type='text'
                                            value={formData.supplier.name}
                                            onChange={(e) => handleNestedInputChange('supplier', 'name', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Contact</label>
                                        <input
                                            type='text'
                                            value={formData.supplier.contact}
                                            onChange={(e) => handleNestedInputChange('supplier', 'contact', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Email</label>
                                        <input
                                            type='email'
                                            value={formData.supplier.email}
                                            onChange={(e) => handleNestedInputChange('supplier', 'email', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Storage Location */}
                            <div className='border-t pt-4'>
                                <h3 className='text-lg font-medium mb-2'>Storage Location</h3>
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Section *</label>
                                        <input
                                            type='text'
                                            value={formData.location.section}
                                            onChange={(e) => handleNestedInputChange('location', 'section', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Shelf</label>
                                        <input
                                            type='text'
                                            value={formData.location.shelf}
                                            onChange={(e) => handleNestedInputChange('location', 'shelf', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>
                                    <div>
                                        <label className='block text-sm font-medium mb-1'>Row</label>
                                        <input
                                            type='text'
                                            value={formData.location.row}
                                            onChange={(e) => handleNestedInputChange('location', 'row', e.target.value)}
                                            className='w-full border rounded px-3 py-2'
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='flex justify-end gap-4 pt-4 border-t'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setShowAddForm(false)
                                        setEditingItem(null)
                                        resetForm()
                                    }}
                                    className='px-6 py-2 border rounded hover:bg-gray-100'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    className='px-6 py-2 bg-primary text-white rounded hover:bg-blue-600'
                                >
                                    {editingItem ? 'Update' : 'Add'} Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
                <div className='hidden sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
                    <p>Code</p>
                    <p>Item Name</p>
                    <p>Category</p>
                    <p>Quantity</p>
                    <p>Unit Price</p>
                    <p>Expiry Date</p>
                    <p>Status</p>
                    <p>Actions</p>
                </div>

                {items.map((item) => (
                    <div key={item._id} className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid sm:grid-cols-[0.5fr_2fr_1fr_1fr_1fr_1fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'>
                        <p>{item.itemCode}</p>
                        <div>
                            <p className='font-medium'>{item.itemName}</p>
                            <p className='text-xs text-gray-400'>{item.description}</p>
                        </div>
                        <p>{item.category}</p>
                        <p>{item.quantity} {item.unit}</p>
                        <p>₹{item.unitPrice}</p>
                        <p>{item.expiryDate ? new Date(item.expiryDate).toDateString() : 'N/A'}</p>
                        <p className={getStatusColor(item.status)}>{item.status}</p>
                        <div className='flex gap-1'>
                            <button
                                onClick={() => editItem(item)}
                                className='text-blue-500 hover:text-blue-700 text-xs'
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    const usage = prompt('Enter quantity to use:')
                                    if (usage && !isNaN(usage)) {
                                        const department = prompt('Enter department:') || 'General'
                                        const purpose = prompt('Enter purpose:') || 'Usage'
                                        recordUsage(item._id, { quantityUsed: usage, department, purpose })
                                    }
                                }}
                                className='text-orange-500 hover:text-orange-700 text-xs'
                            >
                                Use
                            </button>
                            <button
                                onClick={() => {
                                    const quantity = prompt('Enter quantity to restock:')
                                    const supplier = prompt('Enter supplier name:') || item.supplier?.name
                                    if (quantity && !isNaN(quantity) && supplier) {
                                        restockItem(item._id, { quantity, supplier, unitPrice: item.unitPrice })
                                    }
                                }}
                                className='text-green-500 hover:text-green-700 text-xs'
                            >
                                Restock
                            </button>
                            <button
                                onClick={() => deleteItem(item._id)}
                                className='text-red-500 hover:text-red-700 text-xs'
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default InventoryManagement
